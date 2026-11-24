import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { decisoesIniciais, fecharMes, parametros2025 } from '@govgame/engine'
import { expect, it } from 'vitest'
import { criarServidor } from './app'
import { abrirCalibracao } from './calibracao'
import { abrirRepositorio, type Partida } from './repositorio'

it('aplica coeficientes ao próximo fechamento, preserva o histórico e carrega a revisão ao reiniciar', async () => {
  const pasta = mkdtempSync(join(tmpdir(), 'govgame-calibracao-'))
  const banco = join(pasta, 'partidas.sqlite')
  const abrir = () => {
    const config = abrirCalibracao(pasta)
    return criarServidor(abrirRepositorio(banco, parametros2025, config), false, config)
  }
  let servidor = abrir()
  const partida = { method: 'GET', url: '/api/partida' } as const
  const fechar = { method: 'POST', url: '/api/partida/turnos' } as const
  const calibrar = { method: 'PUT', url: '/api/calibracao' } as const
  try {
    const inicial = (await servidor.inject(partida)).json()
    const antes = { geracao: inicial.geracao, mesAnterior: 0, versaoParametros: inicial.calibracao.parametros.versao }
    const decisoes = decisoesIniciais(parametros2025)
    const primeiro = await servidor.inject({ ...fechar, payload: { ...antes, decisoes } })
    expect(primeiro.statusCode).toBe(200)
    const estado = primeiro.json<Partida>().estado!
    const payload = { ...antes, mesAnterior: 1, decisoes: estado.decisoes }

    const invalido = await servidor.inject({
      ...calibrar, payload: { ...payload, alteracoes: [{ motor: 'macro', chave: 'ipcaInercia', valor: 0.4 }] },
    })
    expect(invalido.statusCode).toBe(400)
    expect((await servidor.inject(partida)).json().calibracao.parametros.versao).toBe(antes.versaoParametros)

    const atualizado = await servidor.inject({
      ...calibrar, payload: { ...payload, alteracoes: [{ motor: 'orcamento', chave: 'custoDividaFracaoSelic', valor: 0.5 }] },
    })
    expect(atualizado.statusCode).toBe(200)
    const { calibracao, estado: estadoAtual } = atualizado.json()
    const ativos = calibracao.parametros as typeof parametros2025
    expect(ativos.coeficientes.orcamento.custoDividaFracaoSelic.valor).toBe(0.5)
    expect(estadoAtual).toEqual({ ...estado, versao: ativos.versao })
    expect((await servidor.inject({ ...fechar, payload })).statusCode).toBe(409)

    const segundo = await servidor.inject({ ...fechar, payload: { ...payload, versaoParametros: ativos.versao } })
    expect(segundo.statusCode).toBe(200)
    expect(segundo.json().estado).toEqual(JSON.parse(JSON.stringify(fecharMes(estadoAtual, decisoes, ativos).proximoEstado)))
    expect(segundo.json().estado.fluxo.jurosBi).toBeLessThan(estado.fluxo.jurosBi)
    const historico = { method: 'GET', url: '/api/partida/turnos/1' } as const
    expect((await servidor.inject(historico)).json()).toEqual(primeiro.json())

    await servidor.close()
    servidor = abrir()
    const recarregado = (await servidor.inject(partida)).json()
    expect(recarregado.calibracao.parametros).toEqual(ativos)
    expect(recarregado.estado).toEqual(segundo.json().estado)
    expect((await servidor.inject(historico)).json()).toEqual(primeiro.json())
  } finally {
    await servidor.close()
    rmSync(pasta, { recursive: true, force: true })
  }
})

it('expõe o painel de coeficientes apenas no servidor de calibração', async () => {
  const servidor = criarServidor(abrirRepositorio(':memory:', parametros2025))
  try {
    expect((await servidor.inject({ method: 'GET', url: '/api/partida' })).json()).toEqual({ geracao: 0, estado: null })
    expect((await servidor.inject({ method: 'PUT', url: '/api/calibracao', payload: {} })).statusCode).toBe(404)
  } finally {
    await servidor.close()
  }
})
