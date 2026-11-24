import { describe, expect, it } from 'vitest'
import type { ResultadoDoMes } from '../estado'
import { criarEstadoInicial, fecharMes, parametros2025 as params, projetar } from '../index'
import { motorSubsidios } from './subsidios'

function subsidiosDoMes(resultado: ResultadoDoMes) {
  return resultado.trace.find(motor => motor.motor === 'subsidios')!
}

describe('MotorSubsídios', () => {
  // MotorSubsídios §§3 e 5: os valores da base são anuais e a renúncia inicial já é líquida na receita.
  it('carrega os instrumentos disponíveis e contabiliza somente o ajuste nas renúncias', () => {
    const estado = criarEstadoInicial(params)
    const { saidas, avisos } = motorSubsidios(estado, estado.decisoes, params)

    expect(saidas.renunciasVigentesBi).toEqual({
      servicos: 106.6 / 12, agro: 69.4 / 12, industria: 37.5 / 12,
      energia: 0, moradia: 21 / 12, infraestrutura: 0,
    })
    expect(saidas.nivelEfetivoBi.servicos.subsidio).toBe(0)
    expect(saidas.variacaoRenunciasBi).toBe(0)
    expect(saidas.subsidiosBi).toBeCloseTo(43.7 / 12)
    expect(saidas.impulsoPibPct).toBe(0)
    expect(saidas.impulsoIpcaPct).toBe(0)
    expect(avisos).toEqual([])
  })

  // MotorSubsídios §§4 e 5: as três faixas mudam a eficácia, enquanto a despesa entra integralmente.
  it.each([
    { fator: 0.8, efetivo: 0.8 },
    { fator: 1.1, efetivo: 1.1 },
    { fator: 1.15, efetivo: 1.125 },
    { fator: 1.2, efetivo: 1.15 },
    { fator: 1.3, efetivo: 1.15 },
  ])('separa o custo da eficácia com subsídio a $fator da base', ({ fator, efetivo }) => {
    const estado = criarEstadoInicial(params)
    const decisoes = structuredClone(estado.decisoes)
    decisoes.incentivosBi.industria.subsidio *= fator

    const { saidas } = motorSubsidios(estado, decisoes, params)
    expect(saidas.nivelEfetivoBi.industria.subsidio).toBeCloseTo(5.3 / 12 * efetivo)
    expect(saidas.subsidiosBi).toBeCloseTo((43.7 - 5.3 + 5.3 * fator) / 12)
    expect(saidas.variacaoRenunciasBi).toBe(0)
    expect(saidas.impulsoIpcaPct).toBe(0)
  })

  // MotorSubsídios §§4, 5 e 7: o aumento de renúncia afeta a receita já no mês 1 e o PIB no mês 3.
  it('reproduz o impulso de cerca de 0,008 p.p. da renúncia agropecuária 10% maior', () => {
    const estado = criarEstadoInicial(params)
    const decisoes = structuredClone(estado.decisoes)
    decisoes.incentivosBi.agro.renuncia *= 1.1

    const meses = projetar(estado, decisoes, 4, params).meses.map(subsidiosDoMes)
    expect(meses[0].saidas.variacaoRenunciasBi).toBeCloseTo(-69.4 / 12 * 0.1)
    expect(meses[0].saidas.renunciasVigentesBi.agro).toBeCloseTo(69.4 / 12 * 1.1)
    expect(meses[0].avisos).not.toContainEqual(expect.objectContaining({ codigo: 'carenciaRenuncia' }))
    expect(meses.map(mes => mes.saidas.impulsoPibPct)).toEqual([0, 0, expect.any(Number), 0])
    expect(meses[2].saidas.impulsoPibPct).toBeCloseTo(0.008, 3)
  })

  // MotorSubsídios §§5 e 6: o corte de renúncia tem carência e seu custo político aguarda fórmula.
  it('avisa sobre o custo político pendente ao cortar uma renúncia ainda acima da base', () => {
    const inicial = criarEstadoInicial(params)
    const aumento = structuredClone(inicial.decisoes)
    aumento.incentivosBi.agro.renuncia *= 1.2
    const estado = fecharMes(inicial, aumento, params).proximoEstado
    const corte = structuredClone(inicial.decisoes)
    corte.incentivosBi.agro.renuncia *= 1.1
    const aviso = { codigo: 'politicaRenunciaPendente', params: { setor: 'agro' } }

    const meses = projetar(estado, corte, 4, params).meses.map(subsidiosDoMes)
    expect(meses[0].avisos).toContainEqual({ codigo: 'carenciaRenuncia', params: { setor: 'agro', mes: 4 } })
    expect(meses.map(mes => mes.saidas.renunciasVigentesBi.agro)).toEqual([
      aumento.incentivosBi.agro.renuncia, aumento.incentivosBi.agro.renuncia,
      corte.incentivosBi.agro.renuncia, corte.incentivosBi.agro.renuncia,
    ])
    expect(meses.map(mes => mes.avisos.some(item => item.codigo === aviso.codigo))).toEqual([true, true, true, false])
    expect(meses[2].avisos).toContainEqual(aviso)
    expect(meses[2].saidas.variacaoRenunciasBi).toBeCloseTo(-69.4 / 12 * 0.1)
    expect(meses.flatMap(mes => mes.popularidade)).toEqual([])
  })

  // MotorSubsídios §§4 e 7: o PIB pode usar a renúncia conhecida enquanto o multiplicador do subsídio aguarda calibração.
  it('preserva o impulso conhecido e emite o aviso de subsídio no mês em que ele afetaria o PIB', () => {
    const estado = criarEstadoInicial(params)
    const decisoes = structuredClone(estado.decisoes)
    decisoes.incentivosBi.industria.renuncia *= 1.1
    decisoes.incentivosBi.industria.subsidio *= 1.1
    const aviso = { codigo: 'multiplicadorSubsidioPendente', params: {} }

    const meses = projetar(estado, decisoes, 4, params).meses.map(subsidiosDoMes)
    expect(meses[0].avisos).not.toContainEqual(aviso)
    expect(meses[1].avisos).not.toContainEqual(aviso)
    expect(meses[2].avisos).toContainEqual(aviso)
    expect(meses[2].saidas.impulsoPibPct).toBeCloseTo(0.14 * (37.5 / 12 * 0.1) / 1060 * 100, 6)
    expect(meses[3].avisos).not.toContainEqual(aviso)
  })

  // MotorSubsídios §§4 e 7: apenas Agro e Energia são canais de IPCA e aguardam fórmula.
  it.each(['agro', 'energia'] as const)('sinaliza o IPCA indisponível quando muda o subsídio de %s', setor => {
    const estado = criarEstadoInicial(params)
    const decisoes = structuredClone(estado.decisoes)
    decisoes.incentivosBi[setor].subsidio *= 1.1

    const { saidas, avisos } = motorSubsidios(estado, decisoes, params)
    expect(saidas.impulsoIpcaPct).toBeNull()
    expect(avisos).toContainEqual({ codigo: 'incentivosIpcaPendente', params: {} })
  })
})
