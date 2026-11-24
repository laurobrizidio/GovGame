import { limitar, media } from './calculo'
import type { FimDeJogo, GameState, Parametros } from './estado'
import { coef } from './params'

function pontuacao(estado: GameState, params: Parametros): number | null {
  const meses = estado.historico.filter(registro => registro.mes > 0)
  const ultimasAprovacoes = meses.slice(-coef(params, 'turno', 'anoMeses')).map(registro => registro.social.aprovacaoGeral)
  if (ultimasAprovacoes.some(valor => valor === null)) return null

  const componentes = {
    Aprovacao: media(ultimasAprovacoes.filter(valor => valor !== null)),
    Divida: estado.fiscal.dividaPibPct,
    Qualidade: media(meses.map(registro => registro.fiscal.qualidadeServicos)),
    Pib: 100 * ((estado.macro.pibRealMensalBi / estado.historico[0].macro.pibRealMensalBi)
      ** (coef(params, 'turno', 'anoMeses') / estado.mes) - 1),
    Ipca: media(meses.map(registro => registro.macro.ipca12mPct)),
    Desemprego: estado.social.desempregoPct,
  } as const
  let nota = 0
  for (const id of Object.keys(componentes) as (keyof typeof componentes)[]) {
    const pior = coef(params, 'turno', `nota${id}Pior`)
    const melhor = coef(params, 'turno', `nota${id}Melhor`)
    nota += limitar((componentes[id] - pior) / (melhor - pior), 0, 1) * coef(params, 'turno', `nota${id}Peso`)
  }
  return nota * 100 * Math.min(1, estado.mes / coef(params, 'turno', 'mandatoMeses'))
}

export function apurarFimDeJogo(estado: GameState, params: Parametros): FimDeJogo | undefined {
  let tipo: FimDeJogo['tipo'] | undefined
  if (estado.contadores.mesesRiscoMaximo >= coef(params, 'turno', 'mesesCalote')
    || (estado.fiscal.criseRolagem && estado.fiscal.caixaBi === 0)) {
    tipo = 'calote'
  } else if (estado.contadores.mesesAprovacaoBaixa >= coef(params, 'turno', 'mesesImpeachment')) {
    tipo = 'impeachment'
  } else if (estado.contadores.mesesHiperinflacao >= coef(params, 'turno', 'mesesHiperinflacao')) {
    tipo = 'hiperinflacao'
  } else if (estado.mes >= coef(params, 'turno', 'mandatoMeses')) {
    tipo = 'mandato'
  }
  return tipo ? { tipo, pontuacao: pontuacao(estado, params) } : undefined
}
