import { parametros2025, validarTextos, type Mensagem } from '@govgame/engine'
import dados from '../../../../data/2025/textos.pt-BR.json'

validarTextos(dados, parametros2025.segmentos)

export const textos = dados
type ChaveTexto = keyof typeof textos.ui
type Variaveis = Record<string, number | string>

function interpolar(texto: string, dados: Variaveis) {
  return texto.replace(/\{(\w+)\}/g, (trecho, chave: string) =>
    Object.hasOwn(dados, chave) ? String(dados[chave]) : trecho,
  )
}

export function t(chave: ChaveTexto, dados: Variaveis = {}) {
  return interpolar(textos.ui[chave], dados)
}

export function traduzirMensagem(mensagem: Mensagem) {
  const mensagens: Record<string, string> = textos.mensagens
  const grupos: Record<string, Record<string, string>> = { setor: textos.setores, ministerio: textos.ministerios }
  const vars = Object.fromEntries(Object.entries(mensagem.params).map(([chave, valor]) => [
    chave, typeof valor === 'number'
      ? valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
      : grupos[chave]?.[valor] ?? valor,
  ]))
  return interpolar(mensagens[mensagem.codigo] ?? t('mensagemSemTraducao'), vars)
}

export function nomeImpulso(fonte: string) {
  const nomes: Record<string, string> = textos.fontesImpulso
  return nomes[fonte] ?? t('impulsoGenerico')
}

export function textoSegmento(id: string) {
  const segmentos: Record<string, string[]> = textos.segmentos
  return segmentos[id]
}
