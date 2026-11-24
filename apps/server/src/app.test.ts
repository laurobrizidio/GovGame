import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { criarEstadoInicial, decisoesIniciais, fecharMes, parametros2025 } from '@govgame/engine'
import { expect, it } from 'vitest'
import { criarServidor } from './app'
import { abrirRepositorio } from './repositorio'

it('persiste cada commit uma vez, recupera o trace e rejeita decisões desatualizadas', async () => {
  const diretorio = mkdtempSync(join(tmpdir(), 'govgame-test-'))
  const caminho = join(diretorio, 'teste.sqlite')
  let servidor = criarServidor(abrirRepositorio(caminho, parametros2025))
  try {
    const decisoes = decisoesIniciais(parametros2025)
    const payload = { geracao: 0, mesAnterior: 0, decisoes }
    const leitura = { method: 'GET', url: '/api/partida' } as const
    const gravacao = { method: 'POST', url: '/api/partida/turnos' } as const
    expect((await servidor.inject(leitura)).json()).toEqual({ geracao: 0, estado: null })
    const primeiro = await servidor.inject({ ...gravacao, payload })
    expect(primeiro.statusCode).toBe(200)
    expect(primeiro.json().estado.mes).toBe(1)
    expect(primeiro.json().resultado.trace).toHaveLength(7)
    const repetido = await servidor.inject({ ...gravacao, payload })
    expect(repetido.json()).toEqual(primeiro.json())
    const desatualizado = await servidor.inject({
      ...gravacao, payload: { ...payload, decisoes: { ...decisoes, amortizacaoBi: 10 } },
    })
    expect(desatualizado.statusCode).toBe(409)
    await servidor.close()

    servidor = criarServidor(abrirRepositorio(caminho, parametros2025))
    expect((await servidor.inject(leitura)).json()).toEqual(primeiro.json())
    const segundo = await servidor.inject({ ...gravacao, payload: { ...payload, mesAnterior: 1 } })
    expect(segundo.json().estado.mes).toBe(2)
    expect((await servidor.inject({ method: 'GET', url: '/api/partida/turnos/1' })).json()).toEqual(primeiro.json())
    const reiniciado = await servidor.inject({ method: 'DELETE', url: '/api/partida', headers: { 'If-Match': '"0"' } })
    expect(reiniciado.statusCode).toBe(204)
    expect(reiniciado.headers['x-govgame-geracao']).toBe('1')
    expect((await servidor.inject(leitura)).json()).toEqual({ geracao: 1, estado: null })
    expect((await servidor.inject({ ...gravacao, payload })).statusCode).toBe(409)
    expect((await servidor.inject({ ...gravacao, payload: { ...payload, geracao: 1 } })).statusCode).toBe(200)
  } finally {
    await servidor.close()
    rmSync(diretorio, { recursive: true, force: true })
  }
})

it('preenche a aprovação de turnos confirmados sem perder decisões ou encerrar a partida retroativamente', () => {
  const diretorio = mkdtempSync(join(tmpdir(), 'govgame-migracao-'))
  const caminho = join(diretorio, 'teste.sqlite')
  const antiga = { ...parametros2025, versao: '2025.1', iniciais: { ...parametros2025.iniciais, aprovacaoPorClasse: null } }
  const atual = {
    ...parametros2025, versao: '2025.2',
    iniciais: { ...parametros2025.iniciais, aprovacaoPorClasse: { E: 55, D: 55, C: 55, B: 55, A: 55 } },
  }
  let repositorio = abrirRepositorio(caminho, antiga)
  try {
    const decisoes = decisoesIniciais(antiga)
    decisoes.aliquotasPct.A = 0
    const primeiroEsperado = fecharMes(criarEstadoInicial(atual), decisoes, atual)
    for (let mes = 0; mes < 5; mes++) repositorio.gravar(0, mes, decisoes)
    const anterior = repositorio.buscar().estado!
    expect(anterior.social.aprovacaoGeral).toBeNull()
    repositorio.fechar()

    repositorio = abrirRepositorio(caminho, atual)
    const partida = repositorio.buscar()
    const estado = partida.estado!
    expect(partida.geracao).toBe(1)
    expect(estado.versao).toBe(atual.versao)
    expect(estado.mes).toBe(anterior.mes)
    expect(estado.decisoes).toEqual(anterior.decisoes)
    expect(estado.fiscal).toEqual(anterior.fiscal)
    expect(estado.macro).toEqual(anterior.macro)
    expect(estado.historico[0].social.aprovacaoGeral).toBeCloseTo(55)
    expect(estado.historico.every(mes => mes.social.aprovacaoGeral !== null)).toBe(true)
    expect(estado.fimDeJogo).toBeUndefined()
    expect(estado.contadores.mesesAprovacaoBaixa).toBeGreaterThanOrEqual(3)
    expect(repositorio.buscarTurno(1).resultado?.deltas.aprovacao).toBe(primeiroEsperado.deltas.aprovacao)
    expect(partida.resultado?.manchetes.some(manchete => manchete.codigo === 'final.impeachment')).toBe(false)
    expect(() => repositorio.gravar(0, estado.mes, decisoes)).toThrow('partidaAlterada')
    repositorio.fechar()

    repositorio = abrirRepositorio(caminho, atual)
    expect(repositorio.buscar()).toEqual(partida)
    expect(repositorio.gravar(1, estado.mes, decisoes).estado?.fimDeJogo?.tipo).toBe('impeachment')
  } finally {
    repositorio.fechar()
    rmSync(diretorio, { recursive: true, force: true })
  }
})
