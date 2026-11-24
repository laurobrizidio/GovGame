import { describe, expect, it } from 'vitest'
import type { PorIncentivo, PorMinisterio } from '../estado'
import { MINISTERIOS, SETORES, parametros2025 as params } from '../params'
import { motorSocial } from './social'

function preparar(): [Parameters<typeof motorSocial>[0], Parameters<typeof motorSocial>[1]] {
  const { iniciais } = params
  const aliquotasVigentesPct = { E: 0, D: 7.5, C: 15, B: 22.5, A: 27.5 }
  const efeitoPorClasse = { E: 0, D: 0, C: 0, B: 0, A: 0 }
  const macro = {
    pibRealMensalBi: iniciais.pibAnualBi / 12, pibNominalMensalBi: iniciais.pibAnualBi / 12,
    crescimentoPibMensalPct: 0.19, pibReal12mPct: iniciais.pibReal12mPct,
    ipcaMensalPct: 0.35, ipca12mPct: iniciais.ipca12mPct, nivelPrecos: 1,
    dolar: iniciais.dolar, dolarAlvo: iniciais.dolar, dolar12mPct: iniciais.dolar12mPct,
    regimeInflacao: 'controlada' as const,
  }
  const gastosBi = Object.fromEntries(MINISTERIOS.map(id => [id, params.ministerios[id].inicialAnualBi / 12])) as PorMinisterio<number>
  const pisosBi = Object.fromEntries(MINISTERIOS.map(id => [id, gastosBi[id] * params.ministerios[id].pisoFracao])) as PorMinisterio<number>
  const servicos = Object.fromEntries(MINISTERIOS.map(id => [
    id, { nota: 100, mesesAbaixoPiso: 0, abaixoPiso: false },
  ])) as PorMinisterio<{ nota: number; mesesAbaixoPiso: number; abaixoPiso: boolean }>
  const nivelEfetivoBi = Object.fromEntries(SETORES.map(setor => [setor, {
    renuncia: (params.subsidios[setor].renuncia.inicialAnualBi ?? 0) / 12,
    subsidio: (params.subsidios[setor].subsidio.inicialAnualBi ?? 0) / 12,
  }])) as PorIncentivo<number>
  const renunciasVigentesBi = Object.fromEntries(SETORES.map(setor => [
    setor, nivelEfetivoBi[setor].renuncia,
  ])) as Parameters<typeof motorSocial>[1]['subsidios']['renunciasVigentesBi']
  return [
    {
      macro: { ...macro, pibReal12mPct: 2 },
      social: {
        aprovacaoGeral: 60, aprovacaoPorClasse: { E: 60, D: 60, C: 60, B: 60, A: 60 },
        efeitosNivelPorClasse: { ...efeitoPorClasse }, desempregoPct: iniciais.desempregoPct,
        indiceMiseria: iniciais.ipca12mPct + iniciais.desempregoPct,
        segmentos: params.segmentos.map(({ id }) => ({ id, satisfacao: 50, pressionando: false })),
        pressoesExibidas: [],
      },
      fiscal: {
        dividaBi: iniciais.dividaBi, dividaPibPct: iniciais.dividaBi * 100 / iniciais.pibAnualBi,
        caixaBi: iniciais.caixaBi, riscoFiscal: null, premioRiscoAa: null, criseRolagem: null,
        servicos, qualidadeServicos: 100,
      },
    },
    {
      macro,
      bc: {
        selicAa: iniciais.selicAa, selicAlvoAa: iniciais.selicAa, reservasUsdBi: iniciais.reservasUsdBi,
        crescimentoCredito12mPct: iniciais.crescimentoCredito12mPct, inadimplenciaPct: iniciais.inadimplenciaPct,
        vendaReservasUsdBi: 0,
      },
      ir: {
        aliquotasVigentesPct, efeitoPorClasse, arrecadacaoBi: 35, eficienciaAdministracaoPct: 100,
        arrecadacaoPorClasseBi: { E: 0, D: 1.8, C: 8.1, B: 13.05, A: 12.1 },
        fugaCapital: 0, progressividadePp: 23.75, penalidadeInjustica: 0, consumoBi: 0,
        impulsoIpcaPct: 0, impulsoPibPct: 0,
      },
      subsidios: {
        variacaoRenunciasBi: 0, subsidiosBi: 0, renunciasVigentesBi,
        nivelEfetivoBi, impulsoPibPct: 0, impulsoIpcaPct: 0,
      },
      fluxo: {
        receitaIrBi: 35, receitaConsumoBi: 60, receitaEmpresasBi: 44, variacaoRenunciasBi: 0,
        receitaTotalBi: 139, gastosBi, pisosBi, previdenciaBi: 85.6, subsidiosBi: 3.6, despesaPrimariaBi: 188,
        resultadoPrimarioBi: -49, jurosBi: 117, resultadoNominalBi: -166, amortizacaoBi: 0, estimado: true,
      },
      popularidade: [],
    },
  ]
}

describe('MotorSocial', () => {
  // MotorSocial §§4–6: no ponto de partida, miséria é IPCA + desemprego e os segmentos estão em 50.
  it('calcula os indicadores com os valores iniciais sem presumir a aprovação', () => {
    const [estado, entradas] = preparar()
    estado.social.aprovacaoPorClasse = null
    estado.social.aprovacaoGeral = null
    const resultado = motorSocial(estado, entradas, params)
    expect(resultado.saidas.indiceMiseria).toBeCloseTo(9.86)
    expect(resultado.saidas.aprovacaoGeral).toBeNull()
    expect(resultado.saidas.aprovacaoPorClasse).toBeNull()
    expect(resultado.saidas.segmentos).toHaveLength(20)
    expect(resultado.saidas.segmentos.every(segmento => segmento.satisfacao === 50 && !segmento.pressionando)).toBe(true)
    expect(resultado.avisos.map(({ codigo }) => codigo)).toContain('aprovacaoInicialPendente')
  })

  // MotorSocial §4: IR +5 p.p. em todas as classes soma 2,5 ao índice quando F = 1.
  it('aplica o ajuste do IR apenas sob aperto simultâneo de inflação e emprego', () => {
    const [estado, entradas] = preparar()
    entradas.ir.aliquotasVigentesPct = { E: 5, D: 12.5, C: 20, B: 27.5, A: 32.5 }
    entradas.macro.ipca12mPct = 8
    expect(motorSocial(estado, entradas, params).saidas.indiceMiseria).toBeCloseTo(13.6)

    estado.social.desempregoPct = 9
    const resultado = motorSocial(estado, entradas, params)
    expect(resultado.saidas.indiceMiseria).toBeCloseTo(19.5)
    expect(resultado.avisos.map(({ codigo }) => codigo)).toContain('inadimplenciaFamiliarPendente')
  })

  // MotorSocial §4: +10% de proteção social subtrai 0,5 e cada ponto de queda da Saúde acrescenta 0,03 com F = 1.
  it('combina o gasto em proteção social e a nota anterior da Saúde durante crises', () => {
    const [estado, entradas] = preparar()
    entradas.macro.ipca12mPct = 8
    estado.social.desempregoPct = 9
    entradas.fluxo.gastosBi.assistencia *= 1.1
    entradas.fluxo.gastosBi.trabalho *= 1.1
    estado.fiscal.servicos.saude.nota = 90
    expect(motorSocial(estado, entradas, params).saidas.indiceMiseria).toBeCloseTo(16.8)
  })

  // MotorSocial §5: Okun usa o PIB anual do mês anterior e desemprego tem piso de 4%.
  it('usa o PIB defasado no desemprego e respeita o piso estrutural', () => {
    const [estado, entradas] = preparar()
    estado.macro.pibReal12mPct = -2
    entradas.macro.pibReal12mPct = 8
    expect(motorSocial(estado, entradas, params).saidas.desempregoPct).toBeCloseTo(5.6 + 1 / 12)

    estado.macro.pibReal12mPct = 8
    estado.social.desempregoPct = 4.01
    expect(motorSocial(estado, entradas, params).saidas.desempregoPct).toBe(4)
  })

  // MotorSocial §§2–3: o novo efeito de nível entra a 1/3 e o fluxo geral entra integralmente.
  it('acumula fluxos e suaviza efeitos de nível com os pesos das classes', () => {
    const [estado, entradas] = preparar()
    entradas.ir.efeitoPorClasse.D = -1.5
    entradas.popularidade = [{ origem: 'orcamento', delta: -2, rotulo: 'qualidade' }]

    const primeiro = motorSocial(estado, entradas, params)
    expect(primeiro.saidas.aprovacaoPorClasse?.D).toBeCloseTo(57.5)
    expect(primeiro.saidas.aprovacaoPorClasse?.C).toBeCloseTo(58)
    expect(primeiro.saidas.aprovacaoGeral).toBeCloseTo(58 - 0.5 * 0.271)

    const segundo = motorSocial({ ...estado, social: primeiro.saidas }, { ...entradas, popularidade: [] }, params)
    expect(segundo.saidas.aprovacaoPorClasse?.D).toBeCloseTo(57.5 - 1 / 3)
    expect(segundo.saidas.aprovacaoPorClasse?.C).toBeCloseTo(58)
  })

  // MotorSocial §6: pressão entra abaixo de 30 e só termina em 40 ou mais.
  it('aplica histerese com limites distintos para ativação e término', () => {
    const [estado, entradas] = preparar()
    const id = 'educadores'
    const educadores = estado.social.segmentos.find(segmento => segmento.id === id)!
    entradas.macro.ipca12mPct += 15
    const noLimiar = motorSocial(estado, entradas, params).saidas.segmentos.find(segmento => segmento.id === id)
    expect(noLimiar?.satisfacao).toBeCloseTo(30)
    expect(noLimiar?.pressionando).toBe(false)

    educadores.satisfacao = 49
    const abaixo = motorSocial(estado, entradas, params).saidas.segmentos.find(segmento => segmento.id === id)
    expect(abaixo?.pressionando).toBe(true)

    entradas.macro.ipca12mPct -= 15
    educadores.satisfacao = 29
    educadores.pressionando = true
    const continua = motorSocial(estado, entradas, params).saidas.segmentos.find(segmento => segmento.id === id)
    expect(continua).toEqual({ id, satisfacao: 36, pressionando: true })

    educadores.satisfacao = 35
    const termina = motorSocial(estado, entradas, params).saidas.segmentos.find(segmento => segmento.id === id)
    expect(termina).toEqual({ id, satisfacao: 40, pressionando: false })
  })

  // MotorSocial §6: exibe as cinco piores pressões e cada uma das extras custa 0,5 ponto.
  it('exibe cinco pressões em ordem de gravidade e aplica custo pelas demais', () => {
    const [estado, entradas] = preparar()
    estado.social.segmentos = estado.social.segmentos.map((segmento, indice) =>
      indice < 7 ? { ...segmento, satisfacao: 10 - indice, pressionando: true } : segmento,
    )
    const resultado = motorSocial(estado, entradas, params)
    const idsEsperados = params.segmentos.slice(2, 7).reverse().map(({ id }) => id)
    expect(resultado.saidas.pressoesExibidas).toEqual(idsEsperados)
    expect(resultado.saidas.aprovacaoGeral).toBeCloseTo(59)
    expect(resultado.popularidade).toContainEqual({ origem: 'social', delta: -1, rotulo: 'custoPressoes' })
  })
})
