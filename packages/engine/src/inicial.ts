import { somar } from './calculo'
import type { BC, Decisoes, Fiscal, GameState, Macro, Parametros, PorClasse, PorMinisterio, RegistroMes, Servico, Setor, Social } from './estado'
import { calcularSelicAlvo } from './motores/bc'
import { classificarInflacao } from './motores/macro'
import { motorOrcamento, premioPorRisco, premioReservas } from './motores/orcamento'
import { incentivosIniciais } from './motores/subsidios'
import { CLASSES, coef, MINISTERIOS, SETORES } from './params'

export function decisoesIniciais(params: Parametros): Decisoes {
  const anoMeses = coef(params, 'turno', 'anoMeses')
  return {
    aliquotasPct: Object.fromEntries(CLASSES.map(classe => [classe, params.classes[classe].aliquotaInicialPct])) as PorClasse<number>,
    gastosDiscricionariosBi: Object.fromEntries(MINISTERIOS.map(id => {
      const { inicialAnualBi, fixoAnualBi } = params.ministerios[id]
      return [id, (inicialAnualBi - fixoAnualBi) / anoMeses]
    })) as PorMinisterio<number>,
    incentivosBi: incentivosIniciais(params),
    amortizacaoBi: 0,
  }
}

export function criarEstadoInicial(params: Parametros): GameState {
  const i = params.iniciais
  const mesesAno = coef(params, 'turno', 'anoMeses')
  const janela = coef(params, 'turno', 'historicoMensal')
  const notaInicial = coef(params, 'orcamento', 'notaServicoInicial')
  const premioRiscoAa = i.riscoFiscal === null ? null : premioPorRisco(i.riscoFiscal, params) + premioReservas(i.reservasUsdBi, params)
  const pibMensalBi = i.pibAnualBi / mesesAno
  const ipcaMensalPct = coef(params, 'macro', 'ipcaHistoricoAproximado')
  const macro: Macro = {
    pibRealMensalBi: pibMensalBi, pibNominalMensalBi: pibMensalBi,
    crescimentoPibMensalPct: coef(params, 'macro', 'pibMensalBase'),
    pibReal12mPct: i.pibReal12mPct, ipcaMensalPct,
    ipca12mPct: i.ipca12mPct, nivelPrecos: 1, dolar: i.dolar, dolarAlvo: i.dolar,
    dolar12mPct: i.dolar12mPct,
    regimeInflacao: classificarInflacao(ipcaMensalPct, i.ipca12mPct, i.ipca12mPct, params),
  }
  const fiscal: Fiscal = {
    dividaBi: i.dividaBi, dividaPibPct: i.dividaBi / i.pibAnualBi * 100, caixaBi: i.caixaBi,
    riscoFiscal: i.riscoFiscal, premioRiscoAa,
    criseRolagem: i.riscoFiscal === null ? null : i.riscoFiscal >= coef(params, 'orcamento', 'riscoInicioCrise'),
    qualidadeServicos: notaInicial,
    servicos: Object.fromEntries(MINISTERIOS.map(id => [id, { nota: notaInicial, mesesAbaixoPiso: 0, abaixoPiso: false }])) as PorMinisterio<Servico>,
  }
  const bc: BC = {
    selicAa: i.selicAa, selicAlvoAa: calcularSelicAlvo(i.ipca12mPct, i.pibReal12mPct, params),
    crescimentoCredito12mPct: i.crescimentoCredito12mPct, inadimplenciaPct: i.inadimplenciaPct,
    reservasUsdBi: i.reservasUsdBi, vendaReservasUsdBi: 0,
  }
  const social: Social = {
    aprovacaoPorClasse: i.aprovacaoPorClasse,
    aprovacaoGeral: i.aprovacaoPorClasse === null ? null
      : somar(CLASSES.map(id => i.aprovacaoPorClasse![id] * params.classes[id].participacaoPct / 100)),
    efeitosNivelPorClasse: { E: 0, D: 0, C: 0, B: 0, A: 0 },
    desempregoPct: i.desempregoPct, consumoEmpregoPctPibAnual: 0, indiceMiseria: i.desempregoPct + i.ipca12mPct,
    segmentos: params.segmentos.map(({ id }) => ({ id, satisfacao: coef(params, 'social', 'satisfacaoInicial'), pressionando: false })),
    pressoesExibidas: [],
  }
  const decisoes = decisoesIniciais(params)
  const preencher = <T>(valor: T): T[] => Array.from({ length: janela }, () => valor)
  const series: GameState['series'] = {
    selicAa: preencher(i.selicAa), crescimentoPibMensalPct: preencher(null),
    ipcaMensalPct: preencher(macro.ipcaMensalPct), dolar: [...preencher(null).slice(1), i.dolar],
    variacaoDolar12mPct: [...preencher(null).slice(1), i.dolar12mPct],
    inadimplenciaPct: preencher(i.inadimplenciaPct), crescimentoCredito12mPct: preencher(i.crescimentoCredito12mPct),
  }
  const fluxo = motorOrcamento({ macro, fiscal, series, bc }, decisoes, {
    arrecadacaoBi: somar(CLASSES.map(id => params.classes[id].baseTributavelMensalBi * decisoes.aliquotasPct[id] / 100)),
  }, {
    variacaoRenunciasBi: 0, subsidiosBi: somar(SETORES.map(id => decisoes.incentivosBi[id].subsidio)),
  }, params).saidas
  const referencia: RegistroMes = { mes: 0, macro, fiscal, bc, social, fluxo }

  return {
    ...referencia, versao: params.versao, historico: [referencia], decisoes,
    aliquotasVigentesPct: decisoes.aliquotasPct,
    renunciasVigentesBi: Object.fromEntries(SETORES.map(id => [id, decisoes.incentivosBi[id].renuncia])) as Record<Setor, number>,
    carenciaIr: {}, carenciaRenuncias: {},
    nivelEfetivoIncentivosBi: Array.from({ length: coef(params, 'turno', 'historicoIncentivos') }, () => decisoes.incentivosBi),
    series,
    contadores: { mesesAprovacaoBaixa: 0, mesesRiscoMaximo: 0, mesesHiperinflacao: 0 },
  }
}
