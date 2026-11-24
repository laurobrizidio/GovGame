import { describe, expect, it } from 'vitest'
import { criarEstadoInicial, fecharMes, parametros2025 as params } from '../index'

describe('base fiscal de 2025', () => {
  const estado = criarEstadoInicial(params)
  const { fluxo } = fecharMes(estado, estado.decisoes, params).proximoEstado
  const pibAnualBi = params.iniciais.pibAnualBi

  // docs/pendencias.md §24 (BCB, estatísticas fiscais de jan/2026): déficit primário de 2025 de 0,43% do PIB.
  it('abre com resultado primário próximo ao déficit de 2025, de 0,43% do PIB', () => {
    const primarioPctPib = fluxo.resultadoPrimarioBi * 12 / pibAnualBi * 100
    expect(primarioPctPib).toBeGreaterThan(-0.6)
    expect(primarioPctPib).toBeLessThan(-0.3)
  })

  // docs/pendencias.md §24: juros nominais de 2025 de R$ 1,0 tri, cerca de 7,9% do PIB.
  it('abre com a conta de juros próxima a 7,9% do PIB', () => {
    const jurosPctPib = fluxo.jurosBi * 12 / pibAnualBi * 100
    expect(jurosPctPib).toBeGreaterThan(7.4)
    expect(jurosPctPib).toBeLessThan(8.4)
  })

  // MotorOrçamento §7: Selic mensal sobre a dívida; §24 aplica a fração do custo médio.
  it('cobra juros sobre a fração configurada da Selic', () => {
    const cheia = structuredClone(params)
    cheia.coeficientes.orcamento.custoDividaFracaoSelic.valor = 1
    const referencia = fecharMes(criarEstadoInicial(cheia), criarEstadoInicial(cheia).decisoes, cheia).proximoEstado.fluxo
    expect(fluxo.jurosBi).toBeLessThan(referencia.jurosBi)
    expect(fluxo.jurosBi / referencia.jurosBi).toBeCloseTo(0.7, 1)
  })
})
