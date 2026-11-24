import type { Classe, Decisoes, Instrumento, Ministerio, Setor } from './params/schema'

export type { Classe, Decisoes, Instrumento, Ministerio, Parametros, Setor } from './params/schema'
export type PorClasse<T> = Record<Classe, T>
export type PorMinisterio<T> = Record<Ministerio, T>
export type PorIncentivo<T> = Record<Setor, Record<Instrumento, T>>

export type Mensagem = { codigo: string; params: Record<string, number | string> }
export type Impulso = { fonte: string; valor: number }
export type Popularidade = { origem: string; delta: number; rotulo: string }
export type ResultadoMotor<S> = {
  saidas: S
  impulsos: Impulso[]
  popularidade: Popularidade[]
  avisos: Mensagem[]
}

export type Vigencia = { valor: number; mes: number }
export type Servico = { nota: number; mesesAbaixoPiso: number; abaixoPiso: boolean }
export type Segmento = { id: string; satisfacao: number; pressionando: boolean }
export type RegimeInflacao = 'deflacao' | 'desinflacao' | 'controlada' | 'acimaMeta' | 'galopante' | 'superinflacao' | 'hiperinflacao'

export type Macro = {
  pibRealMensalBi: number
  pibNominalMensalBi: number
  crescimentoPibMensalPct: number
  pibReal12mPct: number
  ipcaMensalPct: number
  ipca12mPct: number
  nivelPrecos: number
  dolar: number
  dolarAlvo: number
  dolar12mPct: number | null
  regimeInflacao: RegimeInflacao
}
export type BC = {
  selicAa: number
  selicAlvoAa: number
  crescimentoCredito12mPct: number
  inadimplenciaPct: number
  reservasUsdBi: number
  vendaReservasUsdBi: number
}
export type Social = {
  aprovacaoGeral: number | null
  aprovacaoPorClasse: PorClasse<number> | null
  efeitosNivelPorClasse: PorClasse<number>
  desempregoPct: number
  efeitosDesempregoPpAnual?: { pib: number; ipca: number }
  consumoEmpregoPctPibAnual?: number
  indiceMiseria: number
  segmentos: Segmento[]
  pressoesExibidas: string[]
}
export type Fiscal = {
  dividaBi: number
  dividaPibPct: number
  caixaBi: number
  riscoFiscal: number | null
  premioRiscoAa: number | null
  criseRolagem: boolean | null
  servicos: PorMinisterio<Servico>
  qualidadeServicos: number
}
export type Fluxo = {
  receitaIrBi: number
  receitaConsumoBi: number
  receitaEmpresasBi: number
  receitaOutrasBi: number
  variacaoRenunciasBi: number
  receitaTotalBi: number
  gastosBi: PorMinisterio<number>
  pisosBi: PorMinisterio<number>
  previdenciaBi: number
  subsidiosBi: number
  despesaPrimariaBi: number
  resultadoPrimarioBi: number
  jurosBi: number
  resultadoNominalBi: number
  amortizacaoBi: number
  estimado: boolean
}
export type RegistroMes = {
  mes: number
  macro: Macro
  bc: BC
  social: Social
  fiscal: Fiscal
  fluxo: Fluxo
}
export type GameState = RegistroMes & {
  versao: string
  historico: RegistroMes[]
  decisoes: Decisoes
  aliquotasVigentesPct: PorClasse<number>
  renunciasVigentesBi: Record<Setor, number>
  carenciaIr: Partial<PorClasse<Vigencia>>
  carenciaRenuncias: Partial<Record<Setor, Vigencia>>
  nivelEfetivoIncentivosBi: PorIncentivo<number>[]
  series: {
    selicAa: number[]
    crescimentoPibMensalPct: (number | null)[]
    ipcaMensalPct: number[]
    dolar: (number | null)[]
    variacaoDolar12mPct: (number | null)[]
    inadimplenciaPct: number[]
    crescimentoCredito12mPct: number[]
  }
  contadores: { mesesAprovacaoBaixa: number; mesesRiscoMaximo: number; mesesHiperinflacao: number }
  fimDeJogo?: FimDeJogo
}
export type FimDeJogo = {
  tipo: 'impeachment' | 'calote' | 'hiperinflacao' | 'mandato'
  pontuacao: number | null
}
export type SaidasIR = {
  arrecadacaoBi: number
  arrecadacaoPorClasseBi: PorClasse<number>
  aliquotasVigentesPct: PorClasse<number>
  consumoBi: number
  impulsoPibPct: number
  impulsoIpcaPct: number
  fugaCapital: number
  progressividadePp: number
  penalidadeInjustica: number
  efeitoPorClasse: PorClasse<number>
}
export type SaidasSubsidios = {
  variacaoRenunciasBi: number
  subsidiosBi: number
  renunciasVigentesBi: Record<Setor, number>
  nivelEfetivoBi: PorIncentivo<number>
  impulsoPibPct: number | null
  impulsoIpcaPct: number | null
}
export type PreviewFiscal = {
  ir: SaidasIR
  irAnunciado: Pick<SaidasIR, 'arrecadacaoBi' | 'arrecadacaoPorClasseBi'>
  subsidios: SaidasSubsidios
  fluxo: Fluxo
  avisos: Mensagem[]
}
export type TraceMotor =
  | ({ motor: 'ir' } & ResultadoMotor<SaidasIR>)
  | ({ motor: 'subsidios' } & ResultadoMotor<SaidasSubsidios>)
  | ({ motor: 'orcamento' } & ResultadoMotor<Fluxo>)
  | ({ motor: 'bc' } & ResultadoMotor<BC>)
  | ({ motor: 'macro' } & ResultadoMotor<Macro>)
  | ({ motor: 'social' } & ResultadoMotor<Social>)
  | ({ motor: 'fim' } & ResultadoMotor<Fiscal>)
export type ResultadoDoMes = {
  proximoEstado: GameState
  trace: TraceMotor[]
  deltas: {
    aprovacao: number | null; desemprego: number; ipca: number; selic: number; pib: number
    dolar: number; dividaPib: number; riscoFiscal: number | null; caixa: number
  }
  manchetes: Mensagem[]
  avisos: Mensagem[]
  fimDeJogo?: FimDeJogo
}
export type ItemAgenda = { mes: number; mensagem: Mensagem }
