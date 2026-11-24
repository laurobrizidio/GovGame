import { z } from 'zod'

export const classeSchema = z.enum(['E', 'D', 'C', 'B', 'A'])
export const ministerioSchema = z.enum([
  'saude', 'educacao', 'ciencia', 'cultura', 'trabalho', 'assistencia', 'infraestrutura',
  'agro', 'ambiente', 'industria', 'fazenda', 'administracao', 'defesa', 'exteriores', 'justica',
])
export const setorSchema = z.enum(['servicos', 'agro', 'industria', 'energia', 'moradia', 'infraestrutura'])
export const instrumentoSchema = z.enum(['renuncia', 'subsidio'])
const percentual = z.number().min(0).max(100)
const naoNegativo = z.number().nonnegative()
const fracao = z.number().min(0).max(1)
const origem = {
  status: z.enum(['confirmado', 'a_confirmar', 'pendente']),
  fonte: z.string().trim().min(1, 'Informe o documento e a seção de origem'),
}
const coeficiente = z.discriminatedUnion('status', [
  z.object({ ...origem, status: z.literal('confirmado'), valor: z.number() }),
  z.object({ ...origem, status: z.literal('a_confirmar'), valor: z.number() }),
  z.object({ ...origem, status: z.literal('pendente'), valor: z.null() }),
])

const indicador = z.union([
  z.enum(['ipca', 'desemprego', 'pib', 'selic', 'dolar', 'inadimplencia', 'risco', 'divida', 'fuga']),
  z.templateLiteral(['ir.', classeSchema]),
  z.templateLiteral(['gasto.', ministerioSchema]),
  z.templateLiteral(['incentivo.', setorSchema]),
])

export const decisoesSchema = z.strictObject({
  aliquotasPct: z.record(classeSchema, percentual),
  gastosDiscricionariosBi: z.record(ministerioSchema, naoNegativo),
  incentivosBi: z.record(setorSchema, z.record(instrumentoSchema, naoNegativo)),
  amortizacaoBi: naoNegativo,
})

const ministerio = z.object({
  inicialAnualBi: naoNegativo.positive(),
  fixoAnualBi: naoNegativo,
  pisoFracao: fracao,
  pastas: z.array(z.string().trim().min(1)).min(1),
}).refine(
  ({ fixoAnualBi, inicialAnualBi }) => fixoAnualBi < inicialAnualBi,
  { path: ['fixoAnualBi'], message: 'O orçamento inicial deve ter parcela discricionária' },
)

const incentivo = z.object({
  inicialAnualBi: naoNegativo.nullable(),
  disponivel: z.boolean(),
  ...origem,
}).superRefine((item, ctx) => {
  if (item.disponivel && (item.inicialAnualBi === null || item.inicialAnualBi === 0 || item.status === 'pendente')) {
    ctx.addIssue({
      code: 'custom',
      path: ['inicialAnualBi'],
      message: 'Incentivo disponível exige valor inicial positivo e status confirmado ou a confirmar',
    })
  }
  if (!item.disponivel && item.inicialAnualBi !== null) {
    ctx.addIssue({
      code: 'custom',
      path: ['inicialAnualBi'],
      message: 'Incentivo indisponível deve ter valor inicial nulo',
    })
  }
})

const pesoSegmento = z.number().int().min(-3).max(3).refine(peso => peso !== 0, 'Peso deve ser −3, −2, −1, 1, 2 ou 3')
const segmento = z.object({
  id: z.string().trim().min(1),
  variaveis: z.array(z.object({ indicador, peso: pesoSegmento })).min(1).refine(
    variaveis => new Set(variaveis.map(item => item.indicador)).size === variaveis.length,
    'Cada indicador deve aparecer uma vez por segmento',
  ),
})

export const parametrosSchema = z.object({
  versao: z.string().min(1),
  classes: z.record(classeSchema, z.object({
    participacaoPct: percentual, baseTributavelMensalBi: naoNegativo,
    aliquotaInicialPct: percentual, propensaoConsumo: fracao,
  })).refine(
    classes => Math.abs(Object.values(classes).reduce((total, classe) => total + classe.participacaoPct, 0) - 100) < 0.000001,
    'A participação das classes deve somar 100%',
  ),
  ministerios: z.record(ministerioSchema, ministerio).superRefine((ministerios, ctx) => {
    // MotorOrcamento §§6 e 10. A verba fixa cobre exatamente o piso dessas pastas.
    for (const id of ['saude', 'educacao'] as const) {
      const { fixoAnualBi, inicialAnualBi, pisoFracao } = ministerios[id]
      if (Math.abs(fixoAnualBi - inicialAnualBi * pisoFracao) > 1e-10) {
        ctx.addIssue({
          code: 'custom',
          path: [id, 'fixoAnualBi'],
          message: 'Parcela obrigatória deve ser igual ao piso',
        })
      }
    }
  }),
  subsidios: z.record(setorSchema, z.record(instrumentoSchema, incentivo)),
  segmentos: z.array(segmento).length(20).refine(
    itens => new Set(itens.map(item => item.id)).size === itens.length,
    'Cada segmento deve ter um ID único',
  ),
  coeficientes: z.record(z.string(), z.record(z.string(), coeficiente)),
  iniciais: z.object({
    pibAnualBi: naoNegativo.positive(), pibReal12mPct: z.number(), ipca12mPct: z.number(),
    dolar: naoNegativo.positive(), dolar12mPct: z.number(), selicAa: z.number(),
    dividaBi: naoNegativo, caixaBi: naoNegativo, riscoFiscal: percentual.nullable(),
    receitasConsumoBi: naoNegativo, receitasEmpresasBi: naoNegativo, previdenciaAnualBi: naoNegativo,
    reservasUsdBi: naoNegativo, creditoBi: naoNegativo, crescimentoCredito12mPct: z.number(),
    inadimplenciaPct: percentual, inadimplenciaFamiliasPct: percentual,
    inadimplenciaEmpresasPct: percentual, jurosFamiliasAa: percentual,
    endividamentoFamiliasPct: percentual, comprometimentoRendaPct: percentual,
    desempregoPct: percentual, aprovacaoPorClasse: z.record(classeSchema, percentual).nullable(),
  }),
})

export type Classe = z.infer<typeof classeSchema>
export type Ministerio = z.infer<typeof ministerioSchema>
export type Setor = z.infer<typeof setorSchema>
export type Instrumento = z.infer<typeof instrumentoSchema>
export type IndicadorSocial = z.infer<typeof indicador>
export type Decisoes = z.infer<typeof decisoesSchema>
export type Parametros = z.infer<typeof parametrosSchema>
