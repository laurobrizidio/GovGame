import type { GameState, ItemAgenda, Parametros } from './estado'
import { motorBC } from './motores/bc'
import { coef } from './params'

export function agenda(estado: GameState, params: Parametros): ItemAgenda[] {
  if (estado.fimDeJogo) return []
  const intervalo = coef(params, 'bc', 'reuniaoIntervalo')
  const reuniao = (Math.floor(estado.mes / intervalo) + 1) * intervalo
  const selicPrevista = motorBC({ ...estado, mes: reuniao - 1 }, params).saidas.selicAa
  const itens: ItemAgenda[] = [{ mes: reuniao, mensagem: { codigo: 'reuniaoBC', params: { previsto: selicPrevista } } }]
  for (const [classe, fila] of Object.entries(estado.carenciaIr)) {
    itens.push({ mes: fila.mes, mensagem: { codigo: 'vigenciaIr', params: { classe, valor: fila.valor } } })
  }
  for (const [setor, fila] of Object.entries(estado.carenciaRenuncias)) {
    itens.push({ mes: fila.mes, mensagem: { codigo: 'vigenciaRenuncia', params: { setor, valor: fila.valor } } })
  }
  const defasagem = coef(params, 'subsidios', 'defasagemPib')
  for (let mes = estado.mes + 1; mes <= estado.mes + defasagem; mes++) {
    const distancia = estado.mes + defasagem - mes
    const atual = estado.nivelEfetivoIncentivosBi.at(-distancia - 1)
    const anterior = estado.nivelEfetivoIncentivosBi.at(-distancia - 2)
    if (atual && anterior && JSON.stringify(atual) !== JSON.stringify(anterior)) {
      itens.push({ mes, mensagem: { codigo: 'defasagemIncentivos', params: {} } })
    }
  }
  return itens.filter(item => item.mes <= coef(params, 'turno', 'mandatoMeses')).sort((a, b) => a.mes - b.mes)
}
