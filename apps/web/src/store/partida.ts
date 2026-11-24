import { create } from 'zustand'
import {
  criarEstadoInicial, fecharMes, parametros2025,
  type Decisoes, type GameState, type Parametros, type ResultadoDoMes,
} from '@govgame/engine'
import type { Aba } from '../viewmodels/jogo'

type Calibracao = { parametros: Parametros }
export type AlteracaoCoeficiente = { motor: string; chave: string; valor: number | null }
type Resposta = { geracao: number; estado: GameState | null; resultado?: ResultadoDoMes; calibracao?: Calibracao }
type Erro = 'erroCarregar' | 'erroPreparar' | 'erroSalvar' | 'erroConflito' | 'erroReiniciar'
type Tela = Aba | 'fechamento' | 'fim' | 'historico' | 'calibracao'
type ResultadoCalibracao = { ok: true } | { ok: false; detalhes: string[] }
type Partida = {
  estadoCommitado: GameState
  rascunhoDecisoes: Decisoes
  resultadoPendente: ResultadoDoMes | null
  ultimoResultado: ResultadoDoMes | null
  tela: Tela
  abaAnterior: Aba
  calibracao: Calibracao | null
  geracao: number
  carregado: boolean
  ocupado: boolean
  erro: Erro | null
  carregar: () => Promise<void>
  navegar: (tela: Aba | 'fim' | 'historico' | 'calibracao') => void
  aplicarCoeficientes: (alteracoes: AlteracaoCoeficiente[]) => Promise<ResultadoCalibracao>
  ajustar: (alterar: (decisoes: Decisoes) => Decisoes) => void
  preparar: () => void
  rever: () => void
  confirmar: () => Promise<void>
  reiniciar: () => Promise<void>
}

const estadoInicial = criarEstadoInicial(parametros2025)

export const usarPartida = create<Partida>((set, get) => ({
  estadoCommitado: estadoInicial,
  rascunhoDecisoes: estadoInicial.decisoes,
  resultadoPendente: null,
  ultimoResultado: null,
  tela: 'painel',
  abaAnterior: 'painel',
  calibracao: null,
  geracao: 0,
  carregado: false,
  ocupado: false,
  erro: null,
  carregar: async () => {
    if (get().ocupado || get().carregado) return
    set({ ocupado: true, erro: null })
    try {
      const resposta = await fetch('/api/partida')
      if (!resposta.ok) throw new Error(String(resposta.status))
      const { estado, resultado, geracao, calibracao } = await resposta.json() as Resposta
      const atual = estado ?? (calibracao ? criarEstadoInicial(calibracao.parametros) : estadoInicial)
      set({
        estadoCommitado: atual, rascunhoDecisoes: atual.decisoes, ultimoResultado: resultado ?? null,
        tela: atual.fimDeJogo ? 'fim' : 'painel', carregado: true, geracao, calibracao: calibracao ?? null,
      })
    } catch {
      set({ erro: 'erroCarregar' })
    } finally {
      set({ ocupado: false })
    }
  },
  navegar: tela => {
    if (!get().resultadoPendente && !get().ocupado) set({ tela, erro: null })
  },
  aplicarCoeficientes: async alteracoes => {
    const partida = get()
    if (!partida.calibracao || partida.ocupado || partida.tela !== 'calibracao') return { ok: false, detalhes: [] }
    set({ ocupado: true, erro: null })
    try {
      const resposta = await fetch('/api/calibracao', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geracao: partida.geracao, mesAnterior: partida.estadoCommitado.mes,
          versaoParametros: partida.calibracao.parametros.versao, decisoes: partida.rascunhoDecisoes, alteracoes,
        }),
      })
      if (resposta.status === 409) set({ erro: 'erroConflito' })
      if (!resposta.ok) {
        const { detalhes } = await resposta.json() as { detalhes?: string[] }
        return { ok: false, detalhes: detalhes ?? [] }
      }
      const { estado, geracao, calibracao } = await resposta.json() as Resposta
      if (!calibracao) throw new Error('Missing calibration')
      set({ calibracao, estadoCommitado: estado ?? criarEstadoInicial(calibracao.parametros), geracao })
      return { ok: true }
    } catch {
      return { ok: false, detalhes: [] }
    } finally {
      set({ ocupado: false })
    }
  },
  ajustar: alterar => {
    const partida = get()
    if (partida.resultadoPendente || partida.estadoCommitado.fimDeJogo || partida.ocupado) return
    set({ rascunhoDecisoes: alterar(partida.rascunhoDecisoes) })
  },
  preparar: () => {
    const { estadoCommitado, rascunhoDecisoes, tela, resultadoPendente, ocupado, calibracao } = get()
    if (tela === 'calibracao' || tela === 'historico' || tela === 'fim' || tela === 'fechamento' || estadoCommitado.fimDeJogo || resultadoPendente || ocupado) return
    try {
      const resultado = fecharMes(estadoCommitado, rascunhoDecisoes, calibracao?.parametros ?? parametros2025)
      set({ resultadoPendente: resultado, abaAnterior: tela, tela: 'fechamento', erro: null })
    } catch (error) {
      console.error(error)
      set({ erro: 'erroPreparar' })
    }
  },
  rever: () => {
    if (!get().ocupado) set({ resultadoPendente: null, tela: get().abaAnterior, erro: null })
  },
  confirmar: async () => {
    const partida = get()
    if (partida.ocupado || !partida.resultadoPendente) return
    set({ ocupado: true, erro: null })
    try {
      const resposta = await fetch('/api/partida/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          geracao: partida.geracao, mesAnterior: partida.estadoCommitado.mes, decisoes: partida.rascunhoDecisoes,
          versaoParametros: partida.calibracao?.parametros.versao,
        }),
      })
      if (resposta.status === 409) {
        set({ erro: 'erroConflito' })
        return
      }
      if (!resposta.ok) throw new Error(String(resposta.status))
      const { estado, resultado, geracao } = await resposta.json() as Resposta
      if (!estado) throw new Error('Missing state')
      set({
        estadoCommitado: estado, rascunhoDecisoes: estado.decisoes,
        resultadoPendente: null, ultimoResultado: resultado ?? partida.resultadoPendente,
        tela: estado.fimDeJogo ? 'fim' : 'painel', geracao,
      })
    } catch {
      set({ erro: 'erroSalvar' })
    } finally {
      set({ ocupado: false })
    }
  },
  reiniciar: async () => {
    const partida = get()
    if (partida.ocupado) return
    set({ ocupado: true, erro: null })
    try {
      const headers = new Headers({ 'If-Match': String(partida.geracao) })
      if (partida.calibracao) headers.set('X-GovGame-Versao-Parametros', partida.calibracao.parametros.versao)
      const resposta = await fetch('/api/partida', { method: 'DELETE', headers })
      if (resposta.status === 409) {
        set({ erro: 'erroConflito' })
        return
      }
      if (!resposta.ok) throw new Error(String(resposta.status))
      const token = resposta.headers.get('X-GovGame-Geracao')
      if (!token || !Number.isInteger(Number(token))) throw new Error('Invalid generation')
      const inicial = partida.calibracao ? criarEstadoInicial(partida.calibracao.parametros) : estadoInicial
      set({
        estadoCommitado: inicial, rascunhoDecisoes: inicial.decisoes,
        resultadoPendente: null, ultimoResultado: null, tela: 'painel', abaAnterior: 'painel', geracao: Number(token),
      })
    } catch {
      set({ erro: 'erroReiniciar' })
    } finally {
      set({ ocupado: false })
    }
  },
}))

export const usarParametros = () => usarPartida(partida => partida.calibracao?.parametros ?? parametros2025)
