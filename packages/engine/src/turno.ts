import type { Decisoes, GameState, Parametros, RegistroMes, ResultadoDoMes, TraceMotor } from './estado'
import { apurarFimDeJogo } from './fim-de-jogo'
import { manchetesDoMes } from './manchetes'
import { intervirNoDolar, motorBC } from './motores/bc'
import { aplicarDolar, motorMacro } from './motores/macro'
import { atualizarFiscal } from './motores/orcamento'
import { motorSocial } from './motores/social'
import { coef } from './params'
import { calcularMotoresFiscais, validarDecisoes } from './preview'

const deltaOpcional = (anterior: number | null, atual: number | null) => anterior === null || atual === null ? null : atual - anterior

export function fecharMes(estado: GameState, rascunho: Decisoes, params: Parametros): ResultadoDoMes {
  if (estado.versao !== params.versao) throw new RangeError('versaoIncompativel')
  if (estado.fimDeJogo || estado.mes >= coef(params, 'turno', 'mandatoMeses')) throw new RangeError('mandatoEncerrado')
  const decisoes = validarDecisoes(rascunho, params)
  const { ir, subsidios, orcamento } = calcularMotoresFiscais(estado, decisoes, params)
  const bc = motorBC(estado, params)
  const macro = motorMacro(estado, { ir: ir.saidas, subsidios: subsidios.saidas, bc: bc.saidas }, params)
  const intervencao = intervirNoDolar(estado, bc.saidas, macro.saidas.dolar, params)
  const bcFinal = intervencao.bc
  const macroFinal = aplicarDolar(macro.saidas, estado, intervencao.dolar, params)
  const social = motorSocial(estado, {
    ir: ir.saidas, subsidios: subsidios.saidas, fluxo: orcamento.saidas,
    bc: bcFinal, macro: macroFinal,
    popularidade: [...ir.popularidade, ...subsidios.popularidade, ...orcamento.popularidade, ...bc.popularidade, ...macro.popularidade],
  }, params)
  const fiscal = atualizarFiscal(estado, orcamento.saidas, macroFinal.pibNominalMensalBi, params)
  const fluxo = orcamento.saidas
  const mes = estado.mes + 1
  const registro: RegistroMes = { mes, macro: macroFinal, bc: bcFinal, social: social.saidas, fiscal, fluxo }
  const janela = coef(params, 'turno', 'historicoMensal')
  const series = estado.series
  const registrar = <T>(historico: T[], valor: T) => [...historico, valor].slice(-janela)

  const proximoEstado: GameState = {
    ...registro,
    versao: estado.versao,
    historico: [...estado.historico, registro],
    decisoes: { ...decisoes, amortizacaoBi: 0 },
    aliquotasVigentesPct: ir.saidas.aliquotasVigentesPct,
    renunciasVigentesBi: subsidios.saidas.renunciasVigentesBi,
    carenciaIr: ir.carencia,
    carenciaRenuncias: subsidios.carencia,
    nivelEfetivoIncentivosBi: [...estado.nivelEfetivoIncentivosBi, subsidios.saidas.nivelEfetivoBi]
      .slice(-coef(params, 'turno', 'historicoIncentivos')),
    series: {
      selicAa: registrar(series.selicAa, bcFinal.selicAa),
      crescimentoPibMensalPct: registrar(series.crescimentoPibMensalPct, macroFinal.crescimentoPibMensalPct),
      ipcaMensalPct: registrar(series.ipcaMensalPct, macroFinal.ipcaMensalPct),
      dolar: registrar(series.dolar, macroFinal.dolar),
      variacaoDolar12mPct: registrar(series.variacaoDolar12mPct, macroFinal.dolar12mPct),
      inadimplenciaPct: registrar(series.inadimplenciaPct, bcFinal.inadimplenciaPct),
      crescimentoCredito12mPct: registrar(series.crescimentoCredito12mPct, bcFinal.crescimentoCredito12mPct),
    },
    contadores: {
      mesesAprovacaoBaixa: social.saidas.aprovacaoGeral !== null && social.saidas.aprovacaoGeral < coef(params, 'turno', 'aprovacaoImpeachment')
        ? estado.contadores.mesesAprovacaoBaixa + 1 : 0,
      mesesRiscoMaximo: fiscal.riscoFiscal === coef(params, 'orcamento', 'riscoMaximo') ? estado.contadores.mesesRiscoMaximo + 1 : 0,
      mesesHiperinflacao: macroFinal.ipcaMensalPct > coef(params, 'turno', 'ipcaHiperinflacaoMensal')
        ? estado.contadores.mesesHiperinflacao + 1 : 0,
    },
  }
  const fimDeJogo = apurarFimDeJogo(proximoEstado, params)
  if (fimDeJogo) proximoEstado.fimDeJogo = fimDeJogo
  const trace: TraceMotor[] = [
    { motor: 'ir', saidas: ir.saidas, impulsos: ir.impulsos, popularidade: ir.popularidade, avisos: ir.avisos },
    { motor: 'subsidios', saidas: subsidios.saidas, impulsos: subsidios.impulsos, popularidade: subsidios.popularidade, avisos: subsidios.avisos },
    { motor: 'orcamento', ...orcamento },
    { motor: 'bc', ...bc, saidas: bcFinal },
    { motor: 'macro', ...macro, saidas: macroFinal },
    { motor: 'social', ...social },
    { motor: 'fim', saidas: fiscal, impulsos: [], popularidade: [], avisos: [] },
  ]
  return {
    proximoEstado, trace, fimDeJogo,
    deltas: {
      aprovacao: deltaOpcional(estado.social.aprovacaoGeral, social.saidas.aprovacaoGeral),
      desemprego: social.saidas.desempregoPct - estado.social.desempregoPct,
      ipca: macroFinal.ipca12mPct - estado.macro.ipca12mPct,
      selic: bcFinal.selicAa - estado.bc.selicAa,
      pib: macroFinal.pibReal12mPct - estado.macro.pibReal12mPct,
      dolar: macroFinal.dolar - estado.macro.dolar,
      dividaPib: fiscal.dividaPibPct - estado.fiscal.dividaPibPct,
      riscoFiscal: deltaOpcional(estado.fiscal.riscoFiscal, fiscal.riscoFiscal),
      caixa: fiscal.caixaBi - estado.fiscal.caixaBi,
    },
    manchetes: manchetesDoMes(proximoEstado, ir.saidas),
    avisos: trace.flatMap(motor => motor.avisos),
  }
}
