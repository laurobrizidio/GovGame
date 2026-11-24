import { z } from 'zod'
import { ministerioSchema, setorSchema } from './schema'

const texto = z.string().min(1)
const dicionario = z.record(z.string(), texto)
const par = z.tuple([texto, texto])
const catalogoSchema = z.object({
  ui: dicionario,
  abas: dicionario,
  kpis: dicionario,
  ministerios: z.record(ministerioSchema, texto),
  setores: z.record(setorSchema, texto),
  segmentos: z.record(z.string(), par),
  regimes: z.record(z.string(), par),
  motores: z.record(z.string(), par),
  finais: z.record(z.string(), par),
  mensagens: dicionario,
  fontesImpulso: dicionario,
})

export function validarTextos(dados: unknown, segmentos: readonly { id: string }[]) {
  const catalogo = catalogoSchema.parse(dados)
  for (const { id } of segmentos) {
    if (!catalogo.segmentos[id]) throw new Error(`Texto ausente para o segmento ${id}`)
  }
}
