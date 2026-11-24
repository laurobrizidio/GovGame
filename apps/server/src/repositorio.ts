import { isDeepStrictEqual } from 'node:util'
import Database from 'better-sqlite3'
import { and, asc, desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { criarEstadoInicial, fecharMes, type Decisoes, type GameState, type Parametros, type ResultadoDoMes } from '@govgame/engine'

const partidas = sqliteTable('games', {
  id: integer('id').primaryKey(),
  nome: text('nome').notNull(),
  versao: text('params_version').notNull(),
  criadaEm: text('created_at').notNull(),
  status: text('status').notNull(),
  finalTipo: text('final_tipo'),
})

const metadados = sqliteTable('session', {
  id: integer('id').primaryKey(),
  geracao: integer('generation').notNull(),
})

const turnos = sqliteTable('turns', {
  partidaId: integer('game_id').notNull().references(() => partidas.id, { onDelete: 'cascade' }),
  turno: integer('turn').notNull(),
  decisoes: text('decisions_json', { mode: 'json' }).$type<Decisoes>().notNull(),
  estado: text('state_json', { mode: 'json' }).$type<GameState>().notNull(),
  resultado: text('result_json', { mode: 'json' }).$type<Omit<ResultadoDoMes, 'proximoEstado'>>().notNull(),
  aprovacao: real('aprovacao'),
  dividaPib: real('divida_pib').notNull(),
  riscoFiscal: real('risco_fiscal'),
}, table => [primaryKey({ columns: [table.partidaId, table.turno] })])

export type Partida = { geracao: number; estado: GameState | null; resultado?: ResultadoDoMes }
export type RepositorioDePartidas = {
  buscar(): Partida
  buscarTurno(mes: number): Partida
  gravar(geracao: number, mesAnterior: number, decisoes: Decisoes): Partida
  apagar(geracao: number): number
  fechar(): void
}

export class ConflitoDePartida extends Error {}

export function abrirRepositorio(caminho: string, params: Parametros): RepositorioDePartidas {
  const sqlite = new Database(caminho)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS games (
      id INTEGER PRIMARY KEY, nome TEXT NOT NULL, params_version TEXT NOT NULL,
      created_at TEXT NOT NULL, status TEXT NOT NULL, final_tipo TEXT
    );
    CREATE TABLE IF NOT EXISTS session (id INTEGER PRIMARY KEY, generation INTEGER NOT NULL);
    INSERT OR IGNORE INTO session (id, generation) VALUES (1, 0);
    CREATE TABLE IF NOT EXISTS turns (
      game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
      turn INTEGER NOT NULL, decisions_json TEXT NOT NULL, state_json TEXT NOT NULL,
      result_json TEXT NOT NULL, aprovacao REAL, divida_pib REAL NOT NULL, risco_fiscal REAL,
      PRIMARY KEY (game_id, turn)
    );
  `)
  const db = drizzle(sqlite)
  const id = 1
  const geracaoAtual = () => db.select().from(metadados).where(eq(metadados.id, id)).get()!.geracao
  const ultimoTurno = () => db.select().from(turnos).where(eq(turnos.partidaId, id)).orderBy(desc(turnos.turno)).get()
  const buscarTurno = (mes: number) => db.select().from(turnos).where(and(eq(turnos.partidaId, id), eq(turnos.turno, mes))).get()
  const montarPartida = (geracao: number, turno?: typeof turnos.$inferSelect): Partida => turno
    ? { geracao, estado: turno.estado, resultado: { ...turno.resultado, proximoEstado: turno.estado } }
    : { geracao, estado: null }

  const dadosTurno = (decisoes: Decisoes, fechamento: ResultadoDoMes) => {
    const { proximoEstado, ...resultado } = fechamento
    return {
      decisoes, estado: proximoEstado, resultado,
      aprovacao: proximoEstado.social.aprovacaoGeral,
      dividaPib: proximoEstado.fiscal.dividaPibPct,
      riscoFiscal: proximoEstado.fiscal.riscoFiscal,
    }
  }

  const migrarAprovacao = sqlite.transaction(() => {
    const partida = db.select().from(partidas).where(eq(partidas.id, id)).get()
    if (partida?.versao !== '2025.1') return
    const historico = db.select().from(turnos).where(eq(turnos.partidaId, id)).orderBy(asc(turnos.turno)).all()
    let estado = criarEstadoInicial(params)
    for (const registro of historico) {
      const resultado = fecharMes(estado, registro.decisoes, params)
      if (resultado.proximoEstado.mes !== registro.turno) throw new Error('Histórico de turnos fora de sequência')

      // O recálculo completa a aprovação de meses já confirmados e conserva o encerramento registrado.
      const fimAnterior = registro.estado.fimDeJogo
      const fimDeJogo = fimAnterior && {
        tipo: fimAnterior.tipo,
        pontuacao: resultado.fimDeJogo?.pontuacao ?? fimAnterior.pontuacao,
      }
      const manchetes = resultado.manchetes.filter(manchete => !manchete.codigo.startsWith('final.'))
      if (fimDeJogo) manchetes.unshift({ codigo: `final.${fimDeJogo.tipo}`, params: {} })
      estado = { ...resultado.proximoEstado, fimDeJogo }
      db.update(turnos)
        .set(dadosTurno(registro.decisoes, { ...resultado, proximoEstado: estado, fimDeJogo, manchetes }))
        .where(and(eq(turnos.partidaId, id), eq(turnos.turno, registro.turno))).run()
    }
    db.update(partidas).set({ versao: params.versao }).where(eq(partidas.id, id)).run()
    db.update(metadados).set({ geracao: geracaoAtual() + 1 }).where(eq(metadados.id, id)).run()
  })
  if (params.versao === '2025.2') migrarAprovacao.immediate()

  const gravar = sqlite.transaction((geracao: number, mesAnterior: number, decisoes: Decisoes): Partida => {
    if (geracao !== geracaoAtual()) throw new ConflitoDePartida('partidaAlterada')
    const anterior = ultimoTurno()
    if (anterior && anterior.turno === mesAnterior + 1 && isDeepStrictEqual(anterior.decisoes, decisoes)) {
      return montarPartida(geracao, anterior)
    }
    const estado = anterior?.estado ?? criarEstadoInicial(params)
    if (estado.mes !== mesAnterior) throw new ConflitoDePartida('mesDesatualizado')
    if (estado.versao !== params.versao) throw new ConflitoDePartida('versaoIncompativel')
    if (estado.fimDeJogo) throw new ConflitoDePartida('mandatoEncerrado')
    const fechamento = fecharMes(estado, decisoes, params)
    const { proximoEstado } = fechamento
    if (!anterior) {
      db.insert(partidas).values({
        id, nome: 'Mandato', versao: params.versao, criadaEm: new Date().toISOString(), status: 'em_andamento',
      }).run()
    }
    db.insert(turnos).values({
      partidaId: id,
      turno: proximoEstado.mes,
      ...dadosTurno(decisoes, fechamento),
    }).run()
    if (proximoEstado.fimDeJogo) {
      db.update(partidas).set({ status: 'encerrada', finalTipo: proximoEstado.fimDeJogo.tipo }).where(eq(partidas.id, id)).run()
    }
    return montarPartida(geracao, buscarTurno(proximoEstado.mes))
  })

  const apagar = sqlite.transaction((geracao: number) => {
    if (geracao !== geracaoAtual()) throw new ConflitoDePartida('partidaAlterada')
    const proxima = geracao + 1
    db.delete(partidas).where(eq(partidas.id, id)).run()
    db.update(metadados).set({ geracao: proxima }).where(eq(metadados.id, id)).run()
    return proxima
  })

  return {
    buscar: sqlite.transaction(() => montarPartida(geracaoAtual(), ultimoTurno())),
    buscarTurno: sqlite.transaction(mes => montarPartida(geracaoAtual(), buscarTurno(mes))),
    gravar: (geracao, mesAnterior, decisoes) => gravar.immediate(geracao, mesAnterior, decisoes),
    apagar: geracao => apagar.immediate(geracao),
    fechar: () => { sqlite.close() },
  }
}
