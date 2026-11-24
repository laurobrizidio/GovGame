import type { Decisoes, GameState, Parametros, PreviewFiscal } from './estado'
import { decisoesIniciais } from './inicial'
import { motorIR } from './motores/ir'
import { motorOrcamento } from './motores/orcamento'
import { motorSubsidios } from './motores/subsidios'
import { CLASSES, coef, decisoesSchema, INSTRUMENTOS, MINISTERIOS, SETORES } from './params'

export function validarDecisoes(decisoes: Decisoes, params: Parametros): Decisoes {
  const valores = decisoesSchema.parse(decisoes)
  const aliquotaMaxima = coef(params, 'ir', 'aliquotaMaxima')
  for (const classe of CLASSES) {
    if (valores.aliquotasPct[classe] > aliquotaMaxima) throw new RangeError(`aliquotaForaLimite:${classe}`)
  }
  const referencia = decisoesIniciais(params)
  const limite = coef(params, 'orcamento', 'limiteSlider')
  for (const id of MINISTERIOS) {
    if (valores.gastosDiscricionariosBi[id] > referencia.gastosDiscricionariosBi[id] * limite + 1e-8) {
      throw new RangeError(`gastoForaLimite:${id}`)
    }
  }
  for (const setor of SETORES) {
    for (const instrumento of INSTRUMENTOS) {
      const disponivel = params.subsidios[setor][instrumento].disponivel
      const valor = valores.incentivosBi[setor][instrumento]
      if (!disponivel ? valor !== 0 && valor !== referencia.incentivosBi[setor][instrumento]
        : valor > referencia.incentivosBi[setor][instrumento] * limite + 1e-8) {
        throw new RangeError(`incentivoForaLimite:${setor}.${instrumento}`)
      }
    }
  }
  return valores
}

export function calcularMotoresFiscais(estado: GameState, decisoes: Decisoes, params: Parametros) {
  const ir = motorIR(estado, decisoes, params)
  const subsidios = motorSubsidios(estado, decisoes, params)
  const orcamento = motorOrcamento(estado, decisoes, ir.saidas, subsidios.saidas, params)
  return { ir, subsidios, orcamento }
}

export function preview(estado: GameState, decisoes: Decisoes, params: Parametros): PreviewFiscal {
  const { ir, subsidios, orcamento } = calcularMotoresFiscais(estado, validarDecisoes(decisoes, params), params)
  return {
    ir: ir.saidas, subsidios: subsidios.saidas, fluxo: orcamento.saidas,
    avisos: [...ir.avisos, ...subsidios.avisos, ...orcamento.avisos],
  }
}
