import {
  CLASSES,
  MINISTERIOS,
  SETORES,
  coef,
  decisoesIniciais,
  type Decisoes,
  type GameState,
  type Ministerio,
  type Parametros,
} from '@govgame/engine'

type Bot = (estado: GameState, params: Parametros) => Decisoes

const passivo: Bot = (_, params) => decisoesIniciais(params)

const austeridade: Bot = (estado, params) => {
  const decisoes = decisoesIniciais(params)
  const mesesAno = coef(params, 'turno', 'anoMeses')
  const limite = coef(params, 'orcamento', 'limiteSlider')
  for (const id of MINISTERIOS) {
    const { inicialAnualBi, fixoAnualBi, pisoFracao } = params.ministerios[id]
    const pisoDiscricionarioBi = (inicialAnualBi * pisoFracao - fixoAnualBi) * estado.macro.nivelPrecos / mesesAno
    const maximoBi = decisoes.gastosDiscricionariosBi[id] * limite
    decisoes.gastosDiscricionariosBi[id] = Math.min(maximoBi, Math.max(0, pisoDiscricionarioBi))
  }
  for (const classe of ['C', 'B', 'A'] as const) {
    decisoes.aliquotasPct[classe] = coef(params, 'ir', 'lafferLimiar')
  }
  for (const setor of SETORES) {
    if (params.subsidios[setor].subsidio.disponivel) decisoes.incentivosBi[setor].subsidio = 0
  }
  return decisoes
}

const ministeriosPrioritarios: readonly Ministerio[] = ['saude', 'educacao', 'trabalho', 'assistencia']
const populista: Bot = (_, params) => {
  const decisoes = decisoesIniciais(params)
  const limite = coef(params, 'orcamento', 'limiteSlider')
  for (const id of ministeriosPrioritarios) decisoes.gastosDiscricionariosBi[id] *= limite
  for (const classe of CLASSES.slice(0, 3)) decisoes.aliquotasPct[classe] = 0
  for (const setor of SETORES) {
    if (params.subsidios[setor].subsidio.disponivel) decisoes.incentivosBi[setor].subsidio *= limite
  }
  return decisoes
}

export const bots = { passivo, austeridade, populista }
