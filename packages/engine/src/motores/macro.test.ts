import { describe, expect, it } from 'vitest'
import type { GameState, SaidasIR, SaidasSubsidios } from '../estado'
import { criarEstadoInicial } from '../inicial'
import { parametros2025 } from '../params'
import { aplicarDolar, classificarInflacao, motorMacro } from './macro'

const params = parametros2025

function entradasDoEstado(estado: GameState) {
  const ir: SaidasIR = {
    arrecadacaoBi: estado.fluxo.receitaIrBi,
    arrecadacaoPorClasseBi: { E: 0, D: 1.8, C: 8.1, B: 13.05, A: 12.1 },
    aliquotasVigentesPct: estado.aliquotasVigentesPct,
    consumoBi: 0,
    impulsoPibPct: 0,
    impulsoIpcaPct: 0,
    fugaCapital: 0,
    progressividadePp: 23.75,
    penalidadeInjustica: 0,
    efeitoPorClasse: { E: 0, D: 0, C: 0, B: 0, A: 0 },
  }
  const subsidios: SaidasSubsidios = {
    variacaoRenunciasBi: 0,
    subsidiosBi: estado.fluxo.subsidiosBi,
    renunciasVigentesBi: estado.renunciasVigentesBi,
    nivelEfetivoBi: estado.decisoes.incentivosBi,
    impulsoPibPct: 0,
    impulsoIpcaPct: 0,
  }
  return { ir, subsidios, bc: estado.bc }
}

describe('MotorMacro', () => {
  it('aplica o consumo por emprego ao PIB e ao IPCA a partir do fechamento anterior', () => {
    // Pesos do consumo do MotorIR §§3.2–3.3 e transmissão aprovada em docs/pendencias.md, item 25.
    const estado = criarEstadoInicial(params)
    const inicial = estado.historico[0]
    estado.mes = 1
    estado.social = { ...estado.social, consumoEmpregoPctPibAnual: 0.936 }
    const anterior = { ...inicial, mes: 1, social: estado.social }
    estado.historico = [inicial, anterior]

    const impulsos = () => Object.fromEntries(motorMacro(estado, entradasDoEstado(estado), params)
      .impulsos.map(({ fonte, valor }) => [fonte, valor]))
    expect(impulsos().pibConsumoEmprego).toBeCloseTo(0.178308, 6)
    expect(impulsos().ipcaConsumoEmprego).toBeCloseTo(0.0054483, 6)

    estado.mes = 2
    estado.historico.push({ ...anterior, mes: 2 })
    expect(impulsos().pibConsumoEmprego).toBe(0)
    expect(impulsos().ipcaConsumoEmprego).toBeCloseTo(0.0054483, 6)

    estado.social = { ...estado.social, consumoEmpregoPctPibAnual: -0.936 }
    expect(impulsos().pibConsumoEmprego).toBeCloseTo(-0.356616, 6)
    expect(impulsos().ipcaConsumoEmprego).toBeCloseTo(-0.0054483, 6)
  })

  // MotorMacro §2 e §3: crescimento base e composição do IPCA com as referências de 2025.
  it('compõe PIB nominal e inflação a partir das variáveis do mês fechado', () => {
    const estado = criarEstadoInicial(params)
    const { saidas, avisos } = motorMacro(estado, entradasDoEstado(estado), params)
    const ipcaEsperado = 0.90 * estado.macro.ipcaMensalPct + 0.10 * 0.25 + 0.02 * (2.3 - 2) + 0.00125 * -11.19
    expect(saidas.crescimentoPibMensalPct).toBeCloseTo(0.19)
    expect(saidas.ipcaMensalPct).toBeCloseTo(ipcaEsperado)
    expect(saidas.ipca12mPct).toBeCloseTo(4.26, 1)
    expect(saidas.pibRealMensalBi).toBeCloseTo(estado.macro.pibRealMensalBi * 1.0019)
    expect(saidas.pibNominalMensalBi).toBeCloseTo(saidas.pibRealMensalBi * (1 + ipcaEsperado / 100))
    expect(saidas.pibReal12mPct).toBe(2.3)
    expect(avisos).toContainEqual({ codigo: 'macroHistoricoPibIncompleto', params: { meses: 1, total: 12 } })
  })

  // MotorMacro §2 e §5: gasto defasado, freio da Selic média e efeito do dólar três meses depois.
  it('soma cada impulso somente na janela temporal documentada', () => {
    const inicial = criarEstadoInicial(params)
    const estado: GameState = {
      ...inicial,
      mes: 1,
      fluxo: { ...inicial.fluxo, despesaPrimariaBi: inicial.fluxo.despesaPrimariaBi + 10.6 },
      series: {
        ...inicial.series,
        crescimentoPibMensalPct: Array<number>(12).fill(0.19),
        selicAa: [...Array<number>(6).fill(13), ...Array<number>(6).fill(16)],
        variacaoDolar12mPct: [null, null, null, null, null, null, null, null, null, 10, -5, 0],
      },
    }
    const entradas = entradasDoEstado(estado)
    entradas.ir.impulsoPibPct = 0.01
    entradas.subsidios.impulsoPibPct = 0.02
    const { saidas, impulsos } = motorMacro(estado, entradas, params)
    const valores = Object.fromEntries(impulsos.map(({ fonte, valor }) => [fonte, valor]))
    expect(valores.pibGasto).toBeCloseTo(0.5)
    expect(valores.pibSelic).toBeCloseTo(-0.02)
    expect(valores.pibDolar).toBeCloseTo(0.02)
    expect(saidas.crescimentoPibMensalPct).toBeCloseTo(0.72)
    expect(saidas.pibReal12mPct).toBeCloseTo((1.0019 ** 11 * 1.0072 - 1) * 100)
  })

  // MotorMacro §4: os 20% de aproximação são aplicados antes da intervenção cambial do MotorBC §5.
  it('distingue o dólar alvo da cotação e recompõe a variação anual após intervenção', () => {
    const inicial = criarEstadoInicial(params)
    const estado: GameState = {
      ...inicial,
      macro: { ...inicial.macro, dolar: 5.58 },
      fiscal: { ...inicial.fiscal, premioRiscoAa: (5.62 / 5.49 - 1) / 0.05 },
    }
    const { saidas } = motorMacro(estado, entradasDoEstado(estado), params)
    expect(saidas.dolarAlvo).toBeCloseTo(5.62)
    expect(saidas.dolar).toBeCloseTo(5.588)
    expect(saidas.dolar12mPct).toBeNull()

    const historico = { ...estado, series: { ...estado.series, dolar: Array<number>(12).fill(5) } }
    const posIntervencao = aplicarDolar(saidas, historico, 5.55, params)
    expect(posIntervencao.dolarAlvo).toBe(saidas.dolarAlvo)
    expect(posIntervencao.dolar12mPct).toBeCloseTo(11)
  })

  // MotorMacro §4 e MotorBC §5: o prêmio das reservas é conhecido mesmo com risco fiscal pendente.
  it('mantém no alvo cambial a parcela conhecida do prêmio de risco', () => {
    const inicial = criarEstadoInicial(params)
    const estado = { ...inicial, bc: { ...inicial.bc, reservasUsdBi: 199 } }
    const { saidas, avisos } = motorMacro(estado, entradasDoEstado(estado), params)
    expect(saidas.dolarAlvo).toBeCloseTo(5.49 * 1.05)
    expect(avisos).toContainEqual({ codigo: 'macroPremioCambialPendente', params: {} })
  })

  // MotorMacro §3: regimes pelo IPCA em 12 meses e critério mensal de Cagan.
  it.each([
    [-0.2, -1, 0, 'deflacao'],
    [0.3, 4, 4.26, 'desinflacao'],
    [0.3, 4.5, 4.26, 'controlada'],
    [0.5, 4.51, 4.6, 'acimaMeta'],
    [0.6, 8, 8.2, 'galopante'],
    [50, 50, 55, 'superinflacao'],
    [50.1, 51, 50, 'hiperinflacao'],
  ] as const)('classifica IPCA mensal %d e anual %d', (mensal, anual, anterior, regime) => {
    expect(classificarInflacao(mensal, anual, anterior, params)).toBe(regime)
  })
})
