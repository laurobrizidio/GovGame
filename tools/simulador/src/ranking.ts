import { mkdirSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { carregarParametros, coeficientesCalibraveis, criarEstadoInicial, fecharMes, parametros2025, type Parametros } from '@govgame/engine'
import { bots } from './bots'

const horizonte = 50
const base = structuredClone(parametros2025)
base.coeficientes.turno.mandatoMeses.valor = horizonte
const politicas = Object.keys(bots) as (keyof typeof bots)[]

function jogar(params: Parametros, politica: keyof typeof bots) {
  let estado = criarEstadoInicial(params)
  let primeiroFinal = ''
  while (estado.mes < horizonte) {
    // Experimento de horizonte fixo. Guardamos o encerramento natural, mas seguimos a trajetória econômica.
    const resultado = fecharMes({ ...estado, fimDeJogo: undefined }, bots[politica](estado, params), params)
    estado = resultado.proximoEstado
    if (!primeiroFinal && estado.fimDeJogo) primeiroFinal = estado.fimDeJogo.tipo + ' M' + estado.mes
  }
  if (estado.social.aprovacaoGeral === null) throw new Error('Aprovação indisponível')
  return { pib: estado.macro.pibRealMensalBi, aprovacao: estado.social.aprovacaoGeral, divida: estado.fiscal.dividaPibPct, primeiroFinal }
}

const referencias = politicas.map(p => jogar(base, p))
type Medida = { politica: string; pib: number; aprovacao: number; divida: number; final: string }
type Variante = { valor: number | null } & (
  { impacto: number; medidas: Medida[] } | { impacto: null; motivo: string }
)

function medir(motor: string, chave: string, inicial: number | null, fator: number): Variante {
  if (inicial === null) return { valor: null, impacto: null, motivo: 'Valor de referência pendente' }
  const valor = Number((inicial * fator).toPrecision(14))
  const candidato = structuredClone(base)
  candidato.coeficientes[motor][chave].valor = valor
  try {
    const params = carregarParametros(candidato)
    const medidas = politicas.map((politica, i) => {
      const fim = jogar(params, politica)
      const ref = referencias[i]
      return { politica, pib: (fim.pib / ref.pib - 1) * 100, aprovacao: fim.aprovacao - ref.aprovacao,
        divida: fim.divida - ref.divida, final: fim.primeiroFinal }
    })
    const impacto = medidas.reduce((s, m) => s + Math.abs(m.pib) + Math.abs(m.aprovacao) + Math.abs(m.divida), 0) / (3 * politicas.length)
    if (!Number.isFinite(impacto)) throw new Error('Resultado não finito')
    return { valor, impacto, medidas }
  } catch (erro) {
    return { valor, impacto: null, motivo: erro instanceof Error ? erro.message : String(erro) }
  }
}

const linhas = coeficientesCalibraveis.map(({ id, motor, chave, nome }) => {
  const inicial = base.coeficientes[motor][chave].valor
  const menos = medir(motor, chave, inicial, 0.8)
  const mais = medir(motor, chave, inicial, 1.2)
  const impacto = menos.impacto === null || mais.impacto === null ? null : (menos.impacto + mais.impacto) / 2
  return { id, nome, inicial, menos, mais, impacto }
})
linhas.sort((a, b) => (b.impacto ?? -1) - (a.impacto ?? -1) || a.id.localeCompare(b.id))
const soma = linhas.reduce((s, l) => s + (l.impacto ?? 0), 0)
let acumulado = 0
const corte = soma && 1 + linhas.findIndex(l => (acumulado += l.impacto ?? 0) >= 0.8 * soma)
const destino = fileURLToPath(new URL('../../../relatorios/', import.meta.url))
mkdirSync(destino, { recursive: true })
const fmt = (n: number | null) => n === null ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: 6 })
const resumo = corte ? 'Os primeiros ' + corte + ' coeficientes atingem 80% da soma dos impactos medidos.' : 'Impacto total medido igual a zero.'
const escape = (v: string) => v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
function celula(variante: Variante) {
  if (variante.impacto === null) return `<td>${fmt(variante.valor)} · ${escape(variante.motivo)}</td>`
  const medidas = variante.medidas.map(m =>
    `${escape(m.politica)} · PIB ${fmt(m.pib)}% · aprovação ${fmt(m.aprovacao)} p.p. · dívida/PIB ${fmt(m.divida)} p.p. · ${escape(m.final || 'em andamento')}`,
  ).join('<br>')
  return `<td><details><summary>Valor ${fmt(variante.valor)} · Impacto ${fmt(variante.impacto)}</summary>${medidas}</details></td>`
}
const tabela = linhas.map((l, i) => `<tr><td>${l.impacto === null ? '—' : i + 1}</td><th scope="row">${escape(l.nome)}<br><small>${escape(l.id)}</small></th><td>${fmt(l.inicial)}</td><td>${fmt(l.impacto)}</td>${celula(l.menos)}${celula(l.mais)}</tr>`).join('\n')
writeFileSync(destino + 'ranking-30-coeficientes.html', `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>GovGame · Ranking de sensibilidade</title>
<style>body{font:16px system-ui;background:#fbfaf6;color:#15211c;max-width:1200px;margin:2em auto;padding:0 1em}table{border-collapse:collapse;width:100%}td,th{text-align:left;padding:.6em;border-bottom:1px solid #d9d4c7}thead{background:#dcebe2}summary{cursor:pointer}small{color:#56615b}section{overflow:auto}</style>
<h1>Sensibilidade no mês 50</h1><p>${resumo}</p>
<p>Cada experimento multiplica um único coeficiente por 0,80 ou 1,20. O impacto é a média dos deltas absolutos nas três estratégias, com peso igual para 1% de PIB real, 1 p.p. de aprovação e 1 p.p. de dívida/PIB. A posição usa a média dos impactos de −20% e +20%.</p>
<p>As trajetórias seguem até o mês 50 mesmo após um encerramento antecipado. Expanda cada teste para ver a direção da mudança em cada indicador e o primeiro encerramento calculado. Os bots podem mudar decisões quando usam o coeficiente alterado como referência.</p>
<section><table><thead><tr><th>Posição</th><th>Coeficiente</th><th>Base</th><th>Impacto médio</th><th>−20%</th><th>+20%</th></tr></thead><tbody>${tabela}</tbody></table></section></html>`)
console.log(resumo)
console.table(linhas.map(l => ({ coeficiente: l.id, menos: fmt(l.menos.impacto), mais: fmt(l.mais.impacto), media: fmt(l.impacto) })))
