import { limitar, media } from '../calculo'
import type { BC, GameState, Parametros, ResultadoMotor } from '../estado'
import { coef } from '../params'

export function calcularSelicAlvo(ipca12m: number, pib12m: number, params: Parametros) {
  return params.iniciais.selicAa
    + coef(params, 'bc', 'alvoIpca') * (ipca12m - params.iniciais.ipca12mPct)
    + coef(params, 'bc', 'alvoPib') * (pib12m - coef(params, 'macro', 'pibPotencial'))
}

function indicadoresNasMetas(estado: Pick<GameState, 'macro' | 'social'>, params: Parametros) {
  const metaIpca = coef(params, 'macro', 'ipcaMetaAnual')
  const toleranciaIpca = coef(params, 'macro', 'ipcaControladaLimite') - metaIpca
  const metaDesemprego = coef(params, 'bc', 'metaDesempregoPct')
  const metaPib = coef(params, 'macro', 'pibPotencial')
  return Math.abs(estado.macro.ipca12mPct - metaIpca) <= toleranciaIpca
    && Math.abs(estado.social.desempregoPct - metaDesemprego) <= coef(params, 'bc', 'metaDesempregoToleranciaPct')
    && Math.abs(estado.macro.pibReal12mPct - metaPib) <= coef(params, 'bc', 'metaPibToleranciaPct')
}

function convergenciaNeutraAtiva(estado: GameState, params: Parametros) {
  const intervalo = coef(params, 'bc', 'reuniaoIntervalo')
  const reuniao = (estado.mes + 1) % intervalo === 0
  const reunioesAnteriores = estado.historico.filter(registro =>
    registro.mes < estado.mes && (registro.mes + 1) % intervalo === 0,
  )
  const observacoes = reuniao ? [...reunioesAnteriores, estado] : reunioesAnteriores
  const duasUltimasReunioes = observacoes.slice(-2)
  if (duasUltimasReunioes.length !== 2 || !duasUltimasReunioes.every(registro => indicadoresNasMetas(registro, params))) {
    return false
  }
  const [anterior, atual] = duasUltimasReunioes
  return Math.abs(atual.macro.ipca12mPct - anterior.macro.ipca12mPct)
      <= coef(params, 'bc', 'tendenciaIpcaLimiarPp')
    && Math.abs(atual.social.desempregoPct - anterior.social.desempregoPct)
      <= coef(params, 'bc', 'tendenciaDesempregoLimiarPp')
}

function direcaoTendencia(variacao: number, limiar: number): -1 | 0 | 1 {
  if (variacao > limiar) return 1
  if (variacao < -limiar) return -1
  return 0
}

function observacoesDeReuniao(estado: GameState, params: Parametros) {
  const intervalo = coef(params, 'bc', 'reuniaoIntervalo')
  return estado.historico.filter(registro => registro.mes < estado.mes
    && (registro.mes === 0 || (registro.mes + 1) % intervalo === 0))
}

function ajustePorTendencias(estado: GameState, params: Parametros): { movimentoAa: number; substituirBase: boolean } | null {
  const observacoes = observacoesDeReuniao(estado, params)
  const anterior = observacoes.at(-1)
  if (!anterior) return null

  const variacaoIpca = estado.macro.ipca12mPct - anterior.macro.ipca12mPct
  const variacaoDesemprego = estado.social.desempregoPct - anterior.social.desempregoPct
  const tendenciaIpca = direcaoTendencia(variacaoIpca, coef(params, 'bc', 'tendenciaIpcaLimiarPp'))
  const tendenciaDesemprego = direcaoTendencia(variacaoDesemprego, coef(params, 'bc', 'tendenciaDesempregoLimiarPp'))
  if (tendenciaIpca === 0 && tendenciaDesemprego === 0) return null

  if (tendenciaIpca === 1 && tendenciaDesemprego === 1) {
    const anteriorAoAnterior = observacoes.at(-2)
    const persistiuAltaConjunta = anteriorAoAnterior !== undefined
      && direcaoTendencia(anterior.macro.ipca12mPct - anteriorAoAnterior.macro.ipca12mPct,
        coef(params, 'bc', 'tendenciaIpcaLimiarPp')) === 1
      && direcaoTendencia(anterior.social.desempregoPct - anteriorAoAnterior.social.desempregoPct,
        coef(params, 'bc', 'tendenciaDesempregoLimiarPp')) === 1
    return {
      movimentoAa: persistiuAltaConjunta ? coef(params, 'bc', 'passoSelic') : 0,
      substituirBase: true,
    }
  }

  const movimentoIpca = tendenciaIpca === 0
    ? 0 : coef(params, 'bc', 'tendenciaIpcaPeso') * variacaoIpca
  const passoDesemprego = tendenciaDesemprego === 1 ? -coef(params, 'bc', 'passoSelic')
    : tendenciaDesemprego === -1 ? coef(params, 'bc', 'passoSelic') : 0
  return { movimentoAa: movimentoIpca + passoDesemprego, substituirBase: false }
}

export function motorBC(estado: GameState, params: Parametros): ResultadoMotor<BC> {
  const anteriores = params.iniciais
  const reuniao = (estado.mes + 1) % coef(params, 'bc', 'reuniaoIntervalo') === 0
  const selicAlvoAa = convergenciaNeutraAtiva(estado, params)
    ? coef(params, 'bc', 'selicNeutraAa')
    : calcularSelicAlvo(estado.macro.ipca12mPct, estado.macro.pibReal12mPct, params)
  const passo = coef(params, 'bc', 'passoSelic')
  const distancia = (selicAlvoAa - estado.bc.selicAa) * coef(params, 'bc', 'fracaoMovimento')
  const movimentoBase = Math.sign(distancia) * Math.round(Math.abs(distancia) / passo) * passo
  const ajusteTendencia = reuniao ? ajustePorTendencias(estado, params) : null
  const movimentoComposto = ajusteTendencia?.substituirBase
    ? ajusteTendencia.movimentoAa : movimentoBase + (ajusteTendencia?.movimentoAa ?? 0)
  const movimentoBruto = Math.sign(movimentoComposto)
    * Math.round(Math.abs(movimentoComposto) / passo) * passo
  const maximo = coef(params, 'bc', 'movimentoMaximo')
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
