import { acumularTaxas, media, somar } from '../calculo'
import type { BC, GameState, Impulso, Macro, Mensagem, Parametros, RegimeInflacao, ResultadoMotor, SaidasIR, SaidasSubsidios } from '../estado'
import { coef } from '../params'
import { premioReservas } from './orcamento'

type EntradasMacro = { ir: SaidasIR; subsidios: SaidasSubsidios; bc: BC }

export function classificarInflacao(
  ipcaMensalPct: number,
  ipca12mPct: number,
  anterior12mPct: number,
  params: Parametros,
): RegimeInflacao {
  if (ipcaMensalPct > coef(params, 'turno', 'ipcaHiperinflacaoMensal')) return 'hiperinflacao'
  if (ipca12mPct < 0) return 'deflacao'
  if (ipca12mPct >= coef(params, 'macro', 'ipcaSuperinflacaoLimiar')) return 'superinflacao'
  if (ipca12mPct >= coef(params, 'macro', 'ipcaGalopanteLimiar')) return 'galopante'
  if (ipca12mPct > coef(params, 'macro', 'ipcaControladaLimite')) return 'acimaMeta'
  if (ipca12mPct > 0 && ipca12mPct < anterior12mPct) return 'desinflacao'
  return 'controlada'
}

export function aplicarDolar(macro: Macro, estado: GameState, dolar: number, params: Parametros): Macro {
  const dolarAnoAnterior = estado.series.dolar.at(-coef(params, 'turno', 'anoMeses'))
  const dolar12mPct = dolarAnoAnterior == null ? null : (dolar / dolarAnoAnterior - 1) * 100
  return { ...macro, dolar, dolar12mPct }
}

export function motorMacro(
  estado: GameState,
  entradas: EntradasMacro,
  params: Parametros,
): ResultadoMotor<Macro> {
  const { ir, subsidios, bc } = entradas
  const { macro: anterior, fiscal, series } = estado
  const mesesAno = coef(params, 'turno', 'anoMeses')
  // MotorBC §4 ainda não especifica como o crescimento do crédito se converte em PIB.
  const avisos: Mensagem[] = [
    { codigo: 'macroCreditoPibPendente', params: {} },
  ]

  // MotorMacro §2 e §5. Gasto e câmbio entram com a defasagem própria de cada série.
  const mesGasto = estado.mes + 1 - coef(params, 'macro', 'gastoDefasagem')
  const despesa = (mes: number) => mes === estado.mes
    ? estado.fluxo.despesaPrimariaBi
    : estado.historico.find(registro => registro.mes === mes)?.fluxo.despesaPrimariaBi
  const gastoRecenteBi = despesa(mesGasto)
  const gastoAnteriorBi = despesa(mesGasto - 1)
  const selicMediaAa = media(series.selicAa.slice(-coef(params, 'macro', 'selicMediaMeses')))
  const variacaoDolarDefasada = series.variacaoDolar12mPct.at(-coef(params, 'macro', 'dolarPibDefasagem'))

  const impulsosPib: Impulso[] = [
    { fonte: 'pibBase', valor: coef(params, 'macro', 'pibMensalBase') },
    { fonte: 'pibIr', valor: ir.impulsoPibPct },
    { fonte: 'pibSelic', valor: -coef(params, 'macro', 'selicFreio') * (selicMediaAa - params.iniciais.selicAa) },
  ]
  if (gastoRecenteBi !== undefined && gastoAnteriorBi !== undefined) {
    impulsosPib.push({
      fonte: 'pibGasto',
      valor: coef(params, 'macro', 'gastoMultiplicador') * (gastoRecenteBi - gastoAnteriorBi)
        / coef(params, 'macro', 'pibMensalReferenciaBi') * 100,
    })
  }
  if (variacaoDolarDefasada != null) {
    impulsosPib.push({ fonte: 'pibDolar', valor: coef(params, 'macro', 'dolarPib') * variacaoDolarDefasada })
  }
  if (subsidios.impulsoPibPct != null) {
    impulsosPib.push({ fonte: 'pibSubsidios', valor: subsidios.impulsoPibPct })
  }

  const crescimentoPibMensalPct = somar(impulsosPib.map(({ valor }) => valor))
  const pibRealMensalBi = anterior.pibRealMensalBi * (1 + crescimentoPibMensalPct / 100)
  const pibHistorico = [...series.crescimentoPibMensalPct.slice(-(mesesAno - 1)), crescimentoPibMensalPct]
  const taxasPibConhecidas = pibHistorico.filter(taxa => taxa !== null)
  const pibReal12mPct = taxasPibConhecidas.length === mesesAno
    ? acumularTaxas(taxasPibConhecidas)
    : anterior.pibReal12mPct
  if (taxasPibConhecidas.length < mesesAno) {
    avisos.push({ codigo: 'macroHistoricoPibIncompleto', params: { meses: taxasPibConhecidas.length, total: mesesAno } })
  }

  // MotorMacro §3. Demanda e repasse cambial usam os números do mês fechado.
  const impulsosIpca: Impulso[] = [
    { fonte: 'ipcaInercia', valor: coef(params, 'macro', 'ipcaInercia') * anterior.ipcaMensalPct },
    { fonte: 'ipcaMeta', valor: coef(params, 'macro', 'ipcaMetaPeso') * coef(params, 'macro', 'ipcaMetaMensal') },
    { fonte: 'ipcaDemanda', valor: coef(params, 'macro', 'ipcaDemanda') * (anterior.pibReal12mPct - coef(params, 'macro', 'pibPotencial')) },
    { fonte: 'ipcaIr', valor: ir.impulsoIpcaPct },
  ]
  if (anterior.dolar12mPct != null) {
    impulsosIpca.push({ fonte: 'ipcaDolar', valor: coef(params, 'macro', 'ipcaDolar') * anterior.dolar12mPct })
  }
  if (subsidios.impulsoIpcaPct != null) {
    impulsosIpca.push({ fonte: 'ipcaSubsidios', valor: subsidios.impulsoIpcaPct })
  }
  if (estado.mes + 1 < mesesAno) {
    avisos.push({ codigo: 'macroHistoricoIpcaAproximado', params: {} })
  }
  const notaServicoInicial = coef(params, 'orcamento', 'notaServicoInicial')
  if (fiscal.servicos.infraestrutura.nota < notaServicoInicial) {
    avisos.push({ codigo: 'macroInfraestruturaIpcaPendente', params: {} })
  }
  if (fiscal.servicos.saude.nota < notaServicoInicial || fiscal.servicos.educacao.nota < notaServicoInicial) {
    avisos.push({ codigo: 'macroSaudeEducacaoPibPendente', params: {} })
  }

  const ipcaMensalPct = somar(impulsosIpca.map(({ valor }) => valor))
  const ipca12mPct = acumularTaxas([...series.ipcaMensalPct.slice(-(mesesAno - 1)), ipcaMensalPct])
  const nivelPrecos = anterior.nivelPrecos * (1 + ipcaMensalPct / 100)

  // MotorMacro §4. O prêmio fiscal e o IPCA são os do mês fechado.
  if (fiscal.premioRiscoAa === null) avisos.push({ codigo: 'macroPremioCambialPendente', params: {} })
  const premio = fiscal.premioRiscoAa ?? premioReservas(estado.bc.reservasUsdBi, params)
  const dolarAlvo = params.iniciais.dolar * (
    1
    + coef(params, 'macro', 'dolarPremio') * premio
    + coef(params, 'macro', 'dolarFuga') * ir.fugaCapital
    - coef(params, 'macro', 'dolarSelic') * (bc.selicAa - params.iniciais.selicAa)
    + coef(params, 'macro', 'dolarIpca') * (anterior.ipca12mPct - params.iniciais.ipca12mPct)
  )
  const dolar = anterior.dolar + coef(params, 'macro', 'dolarAproximacao') * (dolarAlvo - anterior.dolar)
  const saidas = aplicarDolar({
    pibRealMensalBi,
    pibNominalMensalBi: pibRealMensalBi * nivelPrecos,
    crescimentoPibMensalPct,
    pibReal12mPct,
    ipcaMensalPct,
    ipca12mPct,
    nivelPrecos,
    dolar,
    dolarAlvo,
    dolar12mPct: null,
    regimeInflacao: classificarInflacao(ipcaMensalPct, ipca12mPct, anterior.ipca12mPct, params),
  }, estado, dolar, params)
  if (saidas.dolar12mPct === null || anterior.dolar12mPct === null || variacaoDolarDefasada == null) {
    avisos.push({ codigo: 'macroHistoricoDolarIncompleto', params: {} })
  }
  return { saidas, impulsos: [...impulsosPib, ...impulsosIpca], popularidade: [], avisos }
}
