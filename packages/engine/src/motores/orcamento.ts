import { limitar, media, somar, taxaMensal } from '../calculo'
import type { Decisoes, Fiscal, Fluxo, GameState, Parametros, PorMinisterio, ResultadoMotor, SaidasIR, SaidasSubsidios, Servico } from '../estado'
import { coef, MINISTERIOS } from '../params'

const abaixoDoPiso = (gasto: number, piso: number) => piso - gasto > 1e-10

export function premioPorRisco(risco: number, params: Parametros): number {
  const baixo = coef(params, 'orcamento', 'riscoFaixaBaixa')
  const alto = coef(params, 'orcamento', 'riscoFaixaAlta')
  const maximo = coef(params, 'orcamento', 'riscoMaximo')
  const premioAlto = coef(params, 'orcamento', 'premioFaixaAlta')
  const premioMaximo = coef(params, 'orcamento', 'premioMaximo')
  const indicador = limitar(risco, 0, maximo)
  if (indicador <= baixo) return 0
  if (indicador <= alto) return premioAlto * (indicador - baixo) / (alto - baixo)
  return premioAlto + (premioMaximo - premioAlto) * (indicador - alto) / (maximo - alto)
}

export function premioReservas(reservasUsdBi: number, params: Parametros): number {
  return reservasUsdBi < coef(params, 'bc', 'reservasLimiarUsdBi') ? coef(params, 'bc', 'premioReservas') : 0
}

export function motorOrcamento(
  estado: Pick<GameState, 'macro' | 'fiscal' | 'series' | 'bc'>,
  decisoes: Decisoes,
  ir: Pick<SaidasIR, 'arrecadacaoBi' | 'eficienciaAdministracaoPct'>,
  subsidios: Pick<SaidasSubsidios, 'variacaoRenunciasBi' | 'subsidiosBi'>,
  params: Parametros,
): ResultadoMotor<Fluxo> {
  const mesesAno = coef(params, 'turno', 'anoMeses')
  const receitaMultiplicador = estado.macro.pibNominalMensalBi / (params.iniciais.pibAnualBi / mesesAno)
  const receitaConsumoBi = params.iniciais.receitasConsumoBi * receitaMultiplicador
  const receitaEmpresasBi = params.iniciais.receitasEmpresasBi * receitaMultiplicador
  const receitaTotalBi = ir.arrecadacaoBi + receitaConsumoBi + receitaEmpresasBi + subsidios.variacaoRenunciasBi
  const gastosBi = {} as PorMinisterio<number>
  const pisosBi = {} as PorMinisterio<number>

  for (const ministerio of MINISTERIOS) {
    const { inicialAnualBi, fixoAnualBi, pisoFracao } = params.ministerios[ministerio]
    const fixoBi = fixoAnualBi / mesesAno * estado.macro.nivelPrecos
    pisosBi[ministerio] = inicialAnualBi * pisoFracao / mesesAno * estado.macro.nivelPrecos
    gastosBi[ministerio] = fixoBi + decisoes.gastosDiscricionariosBi[ministerio]
  }

  const previdenciaBi = params.iniciais.previdenciaAnualBi / mesesAno * estado.macro.nivelPrecos
  const despesaPrimariaBi = somar(Object.values(gastosBi)) + previdenciaBi + subsidios.subsidiosBi
  const resultadoPrimarioBi = receitaTotalBi - despesaPrimariaBi
  const selicMediaAa = media(estado.series.selicAa)
  const premioAa = estado.fiscal.premioRiscoAa ?? premioReservas(estado.bc.reservasUsdBi, params)
  const taxaJurosMensal = Math.max(0, taxaMensal(selicMediaAa, mesesAno) + taxaMensal(premioAa, mesesAno))
  const jurosBi = estado.fiscal.dividaBi * taxaJurosMensal / 100
  const saldoAmortizavelBi = Math.max(0, estado.fiscal.caixaBi - coef(params, 'orcamento', 'caixaMinimoBi'))
  const amortizacaoBi = Math.min(decisoes.amortizacaoBi, saldoAmortizavelBi, estado.fiscal.dividaBi)
  const qualidadeDelta = coef(params, 'orcamento', 'qualidadePopularidade')
    * (estado.fiscal.qualidadeServicos - coef(params, 'orcamento', 'notaServicoInicial'))

  return {
    saidas: {
      receitaIrBi: ir.arrecadacaoBi, receitaConsumoBi, receitaEmpresasBi,
      variacaoRenunciasBi: subsidios.variacaoRenunciasBi,
      receitaTotalBi, gastosBi, pisosBi, previdenciaBi, subsidiosBi: subsidios.subsidiosBi,
      despesaPrimariaBi, resultadoPrimarioBi, jurosBi, resultadoNominalBi: resultadoPrimarioBi - jurosBi,
      amortizacaoBi, estimado: ir.eficienciaAdministracaoPct === null || estado.fiscal.premioRiscoAa === null,
    },
    impulsos: [],
    popularidade: [
      ...(qualidadeDelta === 0 ? [] : [{ origem: 'orcamento', rotulo: 'qualidadePopularidade', delta: qualidadeDelta }]),
      ...(estado.fiscal.criseRolagem ? [{ origem: 'orcamento', rotulo: 'crisePopularidade', delta: coef(params, 'orcamento', 'crisePopularidade') }] : []),
    ],
    avisos: [
      ...MINISTERIOS.filter(id => abaixoDoPiso(gastosBi[id], pisosBi[id])).map(id => ({ codigo: 'abaixoPiso', params: { ministerio: id } })),
      ...(estado.fiscal.premioRiscoAa === null ? [{ codigo: 'riscoFiscalPendente', params: {} }] : []),
    ],
  }
}

export function atualizarFiscal(estado: GameState, fluxo: Fluxo, pibNominalMensalBi: number, params: Parametros): Fiscal {
  const caixaAntesVencimentosBi = estado.fiscal.caixaBi - fluxo.amortizacaoBi + Math.max(0, fluxo.resultadoNominalBi)
  const dividaAntesVencimentosBi = estado.fiscal.dividaBi - fluxo.amortizacaoBi + Math.max(0, -fluxo.resultadoNominalBi)
  const pagamentosBi = estado.fiscal.criseRolagem
    ? Math.min(caixaAntesVencimentosBi, dividaAntesVencimentosBi, coef(params, 'orcamento', 'vencimentosBi'))
    : 0
  const caixaBi = caixaAntesVencimentosBi - pagamentosBi
  const dividaBi = dividaAntesVencimentosBi - pagamentosBi
  const notaMaxima = coef(params, 'orcamento', 'notaServicoInicial')
  const servicos = {} as PorMinisterio<Servico>
  for (const id of MINISTERIOS) {
    const anterior = estado.fiscal.servicos[id]
    const abaixoPiso = abaixoDoPiso(fluxo.gastosBi[id], fluxo.pisosBi[id])
    const mesesAbaixoPiso = abaixoPiso ? anterior.mesesAbaixoPiso + 1 : 0
    const variacao = abaixoPiso
      ? -Math.min(coef(params, 'orcamento', 'degradacaoMaxima'), coef(params, 'orcamento', 'degradacaoInicial') * 2 ** (mesesAbaixoPiso - 1))
      : coef(params, 'orcamento', 'recuperacao')
    servicos[id] = { abaixoPiso, mesesAbaixoPiso, nota: limitar(anterior.nota + variacao, 0, notaMaxima) }
  }
  return {
    caixaBi, dividaBi, dividaPibPct: dividaBi / (pibNominalMensalBi * coef(params, 'turno', 'anoMeses')) * 100,
    riscoFiscal: null, premioRiscoAa: null, criseRolagem: estado.fiscal.criseRolagem || null,
    qualidadeServicos: media(Object.values(servicos).map(servico => servico.nota)), servicos,
  }
}
