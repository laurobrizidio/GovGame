import { limitar, media } from '../calculo'
import type { BC, GameState, Parametros, ResultadoMotor } from '../estado'
import { coef } from '../params'
import { premioReservas } from './orcamento'

export function calcularSelicAlvo(ipca12m: number, pib12m: number, premioAa: number, params: Parametros) {
  return params.iniciais.selicAa
    + coef(params, 'bc', 'alvoIpca') * (ipca12m - params.iniciais.ipca12mPct)
    + coef(params, 'bc', 'alvoPib') * (pib12m - coef(params, 'macro', 'pibPotencial'))
    + coef(params, 'bc', 'alvoPremio') * premioAa
}

export function motorBC(estado: GameState, params: Parametros): ResultadoMotor<BC> {
  const anteriores = params.iniciais
  const premioAa = estado.fiscal.premioRiscoAa ?? premioReservas(estado.bc.reservasUsdBi, params)
  const selicAlvoAa = calcularSelicAlvo(estado.macro.ipca12mPct, estado.macro.pibReal12mPct, premioAa, params)
  const passo = coef(params, 'bc', 'passoSelic')
  const distancia = (selicAlvoAa - estado.bc.selicAa) * coef(params, 'bc', 'fracaoMovimento')
  const movimentoBruto = Math.sign(distancia) * Math.round(Math.abs(distancia) / passo) * passo
  const maximo = coef(params, 'bc', 'movimentoMaximo')
  const reuniao = (estado.mes + 1) % coef(params, 'bc', 'reuniaoIntervalo') === 0
  const selicAa = limitar(estado.bc.selicAa + (reuniao ? limitar(movimentoBruto, -maximo, maximo) : 0),
    coef(params, 'bc', 'selicMinima'), coef(params, 'bc', 'selicMaxima'))
  const selicDefasada = estado.series.selicAa.at(-coef(params, 'bc', 'selicDefasagemCredito')) ?? anteriores.selicAa
  const selicMedia = media(estado.series.selicAa.slice(-coef(params, 'bc', 'inadimplenciaMediaSelic')))
  const inadimplenciaAlvo = anteriores.inadimplenciaPct
    + coef(params, 'bc', 'inadimplenciaSelic') * (selicMedia - anteriores.selicAa)
    + coef(params, 'bc', 'inadimplenciaDesemprego') * (estado.social.desempregoPct - anteriores.desempregoPct)
  const inadimplenciaPct = limitar(estado.bc.inadimplenciaPct
    + coef(params, 'bc', 'inadimplenciaAproximacao') * (inadimplenciaAlvo - estado.bc.inadimplenciaPct), 0, 100)
  const creditoAntesAperto = anteriores.crescimentoCredito12mPct
    - coef(params, 'bc', 'creditoSelic') * (selicDefasada - anteriores.selicAa)
    + coef(params, 'bc', 'creditoPib') * (estado.macro.pibReal12mPct - coef(params, 'macro', 'pibPotencial'))
    - coef(params, 'bc', 'creditoInadimplencia') * (estado.bc.inadimplenciaPct - anteriores.inadimplenciaPct)
  const aperto = inadimplenciaPct > coef(params, 'bc', 'inadimplenciaAperto')
  const crescimentoCredito12mPct = creditoAntesAperto * (aperto ? coef(params, 'bc', 'creditoEmAperto') : 1)

  return {
    saidas: { selicAa, selicAlvoAa, crescimentoCredito12mPct, inadimplenciaPct, reservasUsdBi: estado.bc.reservasUsdBi, vendaReservasUsdBi: 0 },
    impulsos: [], popularidade: [],
    avisos: aperto ? [{ codigo: 'apertoCredito', params: {} }] : [],
  }
}

export function intervirNoDolar(estado: GameState, bc: BC, dolar: number, params: Parametros): { dolar: number; bc: BC } {
  const altaPct = (dolar / estado.macro.dolar - 1) * 100
  const limiar = coef(params, 'bc', 'altaDolarIntervencaoPct')
  if (altaPct <= limiar) {
    return { dolar, bc: { ...bc, reservasUsdBi: bc.reservasUsdBi * (1 + coef(params, 'bc', 'rendimentoReservas')) } }
  }
  const reservasPorPp = coef(params, 'bc', 'vendaReservasPorPpUsdBi')
  const vendaReservasUsdBi = Math.min((altaPct - limiar) * reservasPorPp, bc.reservasUsdBi * coef(params, 'bc', 'fracaoMaxVendaReservas'))
  return {
    dolar: dolar - estado.macro.dolar * vendaReservasUsdBi / reservasPorPp / 100,
    bc: { ...bc, reservasUsdBi: bc.reservasUsdBi - vendaReservasUsdBi, vendaReservasUsdBi },
  }
}
