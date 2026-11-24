import {
  CLASSES, MINISTERIOS, coef, decisoesIniciais, parametros2025 as params,
  type Decisoes, type GameState, type Instrumento, type PreviewFiscal, type RegistroMes,
  type ResultadoDoMes, type Setor, type TraceMotor,
} from '@govgame/engine'
import { t, textos } from './textos'

export const abas = Object.keys(textos.abas) as (keyof typeof textos.abas)[]
export type Aba = keyof typeof textos.abas
export type Tom = 'positivo' | 'negativo' | 'neutro'

export const duracaoMandato = coef(params, 'turno', 'mandatoMeses')
export const mesesAno = coef(params, 'turno', 'anoMeses')
export const anosMandato = Math.ceil(duracaoMandato / mesesAno)
export const limiarImpeachment = coef(params, 'turno', 'aprovacaoImpeachment')
export const pressaoEntrada = coef(params, 'social', 'pressaoEntrada')
export const pressaoSaida = coef(params, 'social', 'pressaoSaida')
export const pressaoTeto = coef(params, 'social', 'pressaoTeto')
export const caixaMinimo = coef(params, 'orcamento', 'caixaMinimoBi')
export const criseInicio = coef(params, 'orcamento', 'riscoInicioCrise')
export const criseFim = coef(params, 'orcamento', 'riscoFimCrise')
export const faixaRiscoBaixa = coef(params, 'orcamento', 'riscoFaixaBaixa')
export const faixaRiscoAlta = coef(params, 'orcamento', 'riscoFaixaAlta')
export const faixaRiscoMaxima = coef(params, 'orcamento', 'riscoMaximo')
export const lafferLimiar = coef(params, 'ir', 'lafferLimiar')
export const irMaximo = coef(params, 'ir', 'aliquotaMaxima')
export const lafferPiso = coef(params, 'ir', 'lafferPiso') * 100
export const carenciaMeses = coef(params, 'turno', 'carenciaMeses')

const formatadores = [0, 1, 2, 3].map(casas => new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: casas,
  maximumFractionDigits: casas,
}))

export function num(valor: number | null, casas = 1) {
  return valor === null ? '—' : formatadores[casas].format(valor)
}

export function sinal(valor: number, casas = 1) {
  const arredondado = Number(valor.toFixed(casas))
  const prefixo = arredondado > 0 ? '+' : arredondado < 0 ? '−' : ''
  return prefixo + num(Math.abs(arredondado), casas)
}

export function pct(valor: number | null, casas = 1) {
  return valor === null ? num(null) : num(valor, casas) + '%'
}

export function pp(valor: number, casas = 1, indicarSinal = false) {
  return t('pontos', { valor: indicarSinal ? sinal(valor, casas) : num(valor, casas) })
}

export const bilhoes = (valor: number, casas = 1) => t('bilhoes', { valor: num(valor, casas) })
export const bilhoesPorMes = (valor: number, casas = 1) => t('bilhoesPorMes', { valor: num(valor, casas) })
export const anualizar = (valorMensal: number) => valorMensal * mesesAno
export const bilhoesPorAno = (valorMensal: number, casas = 1) => t('bilhoesPorAno', { valor: num(anualizar(valorMensal), casas) })
export const trilhoes = (valor: number) => t('trilhoes', { valor: num(valor / 1000, 2) })
export const cotacao = (valor: number) => t('reais', { valor: num(valor, 2) })
export const usdBi = (valor: number) => t('usdBi', { valor: num(valor, 2) })
export const biAssinado = (valor: number, casas = 1) => {
  const prefixo = valor < 0 ? '−' : valor > 0 ? '+' : ''
  return prefixo + bilhoes(Math.abs(valor), casas)
}
export const tomDoSaldo = (valor: number): Tom => valor < 0 ? 'negativo' : valor > 0 ? 'positivo' : 'neutro'

type Kpi = {
  id: keyof typeof textos.kpis
  valor: number | null
  exibir: (valor: number | null) => string
  detalhe: string
  aba: Aba
  subir: 'bom' | 'ruim' | 'neutro'
}

export function kpis(estado: RegistroMes): Kpi[] {
  const { social, macro, bc, fiscal } = estado
  return [
    { id: 'aprovacao', valor: social.aprovacaoGeral, exibir: valor => pct(valor, 0), detalhe: social.aprovacaoGeral === null ? t('pendente') : t('aprovaçãoGeral'), aba: 'povo', subir: 'bom' },
    { id: 'desemprego', valor: social.desempregoPct, exibir: pct, detalhe: t('piso', { valor: pct(coef(params, 'social', 'desempregoPiso')) }), aba: 'povo', subir: 'ruim' },
    { id: 'ipca', valor: macro.ipca12mPct, exibir: pct, detalhe: t('regime', { valor: textos.regimes[macro.regimeInflacao][0].toLowerCase() }), aba: 'economia', subir: 'neutro' },
    { id: 'selic', valor: bc.selicAa, exibir: valor => pct(valor, 2), detalhe: t('alvo', { valor: pct(bc.selicAlvoAa, 2) }), aba: 'economia', subir: 'neutro' },
    { id: 'pib', valor: macro.pibReal12mPct, exibir: pct, detalhe: t('potencial', { valor: pct(coef(params, 'macro', 'pibPotencial')) }), aba: 'economia', subir: 'bom' },
    { id: 'dolar', valor: macro.dolar, exibir: valor => valor === null ? num(null) : cotacao(valor), detalhe: t('alvo', { valor: cotacao(macro.dolarAlvo) }), aba: 'economia', subir: 'ruim' },
    { id: 'dividaPib', valor: fiscal.dividaPibPct, exibir: pct, detalhe: trilhoes(fiscal.dividaBi), aba: 'tesouro', subir: 'ruim' },
    { id: 'riscoFiscal', valor: fiscal.riscoFiscal, exibir: valor => num(valor, 0), detalhe: fiscal.premioRiscoAa === null ? t('pendente') : t('premio', { valor: pp(fiscal.premioRiscoAa, 2, true) }), aba: 'tesouro', subir: 'ruim' },
    { id: 'caixa', valor: fiscal.caixaBi, exibir: valor => valor === null ? num(null) : trilhoes(valor), detalhe: t('minimo', { valor: trilhoes(caixaMinimo) }), aba: 'tesouro', subir: 'bom' },
  ]
}

export function compararKpis(anterior: RegistroMes, proximo: RegistroMes) {
  const anteriores = new Map(kpis(anterior).map(kpi => [kpi.id, kpi]))
  return kpis(proximo).map(kpi => {
    const antes = anteriores.get(kpi.id) ?? kpi
    let tom: Tom = 'neutro'
    if (antes.valor !== null && kpi.valor !== null && kpi.exibir(kpi.valor) !== antes.exibir(antes.valor) && kpi.subir !== 'neutro') {
      tom = (kpi.valor > antes.valor) === (kpi.subir === 'bom') ? 'positivo' : 'negativo'
    }
    return {
      id: kpi.id,
      label: textos.kpis[kpi.id],
      anterior: antes.exibir(antes.valor),
      proximo: kpi.exibir(kpi.valor),
      tom,
    }
  })
}

export function deltaHud(resultado: ResultadoDoMes | null, id: Kpi['id']) {
  if (!resultado || !['aprovacao', 'dolar', 'dividaPib'].includes(id)) return null
  const delta = resultado.deltas[id]
  if (delta === null || Math.abs(delta) < 0.00005) return null
  let valor = pp(Math.abs(delta))
  if (id === 'dolar') {
    const anterior = resultado.proximoEstado.macro.dolar - delta
    if (anterior > 0) valor = pct(Math.abs(delta / anterior * 100))
  }
  return {
    sobe: delta > 0,
    tom: (id === 'aprovacao' ? delta > 0 : delta < 0) ? 'positivo' : 'negativo',
    texto: t('noMes', { valor }),
  } as const
}

export function valoresFluxo({ fluxo }: PreviewFiscal) {
  return [
    { label: t('receitas'), valor: fluxo.receitaTotalBi, tom: 'positivo' },
    { label: t('despesas'), valor: -fluxo.despesaPrimariaBi, tom: 'neutro' },
    { label: t('primario'), valor: fluxo.resultadoPrimarioBi, tom: tomDoSaldo(fluxo.resultadoPrimarioBi), total: true },
    { label: t('juros'), valor: -fluxo.jurosBi, tom: 'neutro' },
    { label: t('nominal'), valor: fluxo.resultadoNominalBi, tom: tomDoSaldo(fluxo.resultadoNominalBi), total: true },
  ] as const
}

const baseDecisoes = decisoesIniciais(params)
const limiteSlider = coef(params, 'orcamento', 'limiteSlider')
const retornoIntegral = coef(params, 'subsidios', 'retornoIntegral')
const retornoMetade = coef(params, 'subsidios', 'retornoMetade')

function percentualDoTrilho(valor: number, maximo: number) {
  return maximo > 0 ? Math.min(100, Math.max(0, valor * 100 / maximo)) : 0
}

function zonaExpansao(valor: number, referencia: number) {
  if (valor > referencia * (1 + retornoMetade)) return t('expansaoCusto')
  if (valor > referencia * (1 + retornoIntegral)) return t('expansaoMetade')
  return t('expansaoIntegral')
}

export function gastosPorMinisterio(estado: GameState, decisoes: Decisoes, previa: PreviewFiscal) {
  return MINISTERIOS.map(id => {
    const parametro = params.ministerios[id]
    const valor = decididoGasto(decisoes, id)
    const referencia = decididoGasto(baseDecisoes, id)
    const maximo = referencia * limiteSlider
    const total = previa.fluxo.gastosBi[id]
    const piso = previa.fluxo.pisosBi[id]
    const valorFixo = total - valor
    const variacao = total / (parametro.inicialAnualBi / mesesAno) - 1
    const critica = total < piso - 0.000001
    const expansao = !critica && variacao > 0.00005
    const tom: Tom = critica ? 'negativo' : expansao ? 'positivo' : 'neutro'
    const situacao = critica ? t('critica') : expansao ? t('expansao') : t('ajuste')
    const percentualFixo = parametro.fixoAnualBi / parametro.inicialAnualBi * 100
    const descricao = id === 'saude' || id === 'educacao'
      ? t('parteFixaControlada', { livre: pct(100 - percentualFixo, 0), fixo: pct(percentualFixo, 0) })
      : parametro.fixoAnualBi > 0 ? t('parteFixa') : null
    return {
      id, valor, referencia, maximo, total, piso, tom, situacao, descricao,
      nome: textos.ministerios[id],
      servico: estado.fiscal.servicos[id],
      delta: sinal(variacao * 100) + '%',
      zonas: {
        piso: percentualDoTrilho(piso - valorFixo, maximo),
        expansao: percentualDoTrilho(Math.max(piso, parametro.inicialAnualBi / mesesAno) - valorFixo, maximo),
      },
    }
  })
}

function decididoGasto(decisoes: Decisoes, id: typeof MINISTERIOS[number]) {
  return decisoes.gastosDiscricionariosBi[id]
}

export function aliquotasPorClasse(estado: GameState, decisoes: Decisoes, previa: PreviewFiscal) {
  const receitaEstimada = previa.ir.eficienciaAdministracaoPct === null
  return CLASSES.map(classe => {
    const dados = params.classes[classe]
    const valor = decisoes.aliquotasPct[classe]
    const projetada = previa.ir.aliquotasVigentesPct[classe]
    const vigente = estado.aliquotasVigentesPct[classe]
    const carencia = previa.avisos.find(aviso => aviso.codigo === 'carenciaIr' && aviso.params.classe === classe)
    const mesVigencia = carencia?.params.mes
    const emCarencia = typeof mesVigencia === 'number'
    return {
      classe, valor, projetada, receitaEstimada,
      nome: t('classe', { classe }),
      descricao: t('populacao', { valor: pct(dados.participacaoPct) }),
      base: t('baseTributavel', { valor: bilhoes(dados.baseTributavelMensalBi) }),
      referencia: dados.aliquotaInicialPct,
      situacao: emCarencia ? t('vigenciaIr', { mes: mesVigencia })
        : projetada < vigente ? t('corteIr')
        : projetada > vigente ? t('aliquotaMudaNoMes')
        : t('semVariacao'),
      tom: emCarencia || projetada > vigente ? 'negativo' : projetada < vigente ? 'positivo' : 'neutro',
    } as const
  })
}

export function resumoIncentivos({ fluxo, subsidios }: PreviewFiscal) {
  const renunciaMensal = Object.values(subsidios.renunciasVigentesBi).reduce((total, renuncia) => total + renuncia, 0)
  return [
    { rotulo: t('renunciaProjetadaTotal'), valor: bilhoesPorMes(renunciaMensal) },
    { rotulo: t('subsidioProjetadoTotal'), valor: bilhoesPorMes(fluxo.subsidiosBi) },
  ]
}

export function incentivo(estado: GameState, decisoes: Decisoes, setor: Setor, instrumento: Instrumento, previa: PreviewFiscal) {
  const dados = params.subsidios[setor][instrumento]
  const referencia = baseDecisoes.incentivosBi[setor][instrumento]
  const valor = decisoes.incentivosBi[setor][instrumento]
  const maximo = referencia * limiteSlider
  const variacao = referencia > 0 ? valor / referencia - 1 : 0
  const carencia = instrumento === 'renuncia'
    ? previa.avisos.find(aviso => aviso.codigo === 'carenciaRenuncia' && aviso.params.setor === setor)
    : undefined
  const mesVigencia = carencia?.params.mes
  const emCarencia = typeof mesVigencia === 'number'
  const projetado = previa.subsidios.renunciasVigentesBi[setor]
  const impactoMensal = instrumento === 'renuncia'
    ? estado.renunciasVigentesBi[setor] - projetado
    : valor - estado.decisoes.incentivosBi[setor].subsidio
  const impactoAgendado = projetado - valor
  const situacao = emCarencia ? t('vigenciaRenuncia', { mes: mesVigencia })
    : variacao < -0.00005 ? t('corte') : variacao > 0.00005 ? zonaExpansao(valor, referencia) : t('base')
  return {
    disponivel: dados.disponivel, valor, referencia, maximo,
    descricao: dados.status === 'pendente' ? t('valorPendente') : t('naoSeAplica'),
    label: t('incentivoControle', { instrumento: t(instrumento), setor: textos.setores[setor] }),
    montante: bilhoesPorAno(valor),
    detalhe: emCarencia ? t('renunciaProjetada', { valor: bilhoesPorAno(projetado) }) : null,
    impactoDoMes: Math.abs(impactoMensal) >= 0.005
      ? t(instrumento === 'renuncia' ? 'impactoReceitaDoMes' : 'impactoDespesaDoMes', {
        mensal: biAssinado(impactoMensal, 2), anual: biAssinado(anualizar(impactoMensal)),
      })
      : null,
    impactoFuturo: emCarencia && impactoAgendado >= 0.005
      ? t('impactoReceitaAgendado', {
        mes: mesVigencia, mensal: biAssinado(impactoAgendado, 2), anual: biAssinado(anualizar(impactoAgendado)),
      })
      : null,
    delta: sinal(variacao * 100) + '%',
    situacao,
    tom: emCarencia ? 'negativo' : tomDoSaldo(variacao),
    zonas: {
      inicial: percentualDoTrilho(referencia, maximo),
      integral: percentualDoTrilho(referencia * (1 + retornoIntegral), maximo),
      metade: percentualDoTrilho(referencia * (1 + retornoMetade), maximo),
    },
  }
}

export function resumoMotor(etapa: TraceMotor) {
  switch (etapa.motor) {
    case 'ir':
      return t('motorResumoIr', { receita: bilhoes(etapa.saidas.arrecadacaoBi), progressividade: pp(etapa.saidas.progressividadePp, 2) })
    case 'subsidios':
      return t('motorResumoSubsidios', { despesa: bilhoes(etapa.saidas.subsidiosBi, 2), receita: biAssinado(etapa.saidas.variacaoRenunciasBi, 2) })
    case 'orcamento':
      return t('motorResumoOrcamento', {
        receita: bilhoes(etapa.saidas.receitaTotalBi, 2), despesa: bilhoes(etapa.saidas.despesaPrimariaBi, 2),
        primario: biAssinado(etapa.saidas.resultadoPrimarioBi), juros: bilhoes(etapa.saidas.jurosBi), nominal: biAssinado(etapa.saidas.resultadoNominalBi),
      })
    case 'bc':
      return t('motorResumoBc', { selic: pct(etapa.saidas.selicAa, 2), credito: pct(etapa.saidas.crescimentoCredito12mPct), inadimplencia: pct(etapa.saidas.inadimplenciaPct) })
    case 'macro':
      return t('motorResumoMacro', { pib: pct(etapa.saidas.pibReal12mPct), ipca: pct(etapa.saidas.ipca12mPct), dolar: cotacao(etapa.saidas.dolar) })
    case 'social':
      return t('motorResumoSocial', { desemprego: pct(etapa.saidas.desempregoPct), miseria: num(etapa.saidas.indiceMiseria) })
    case 'fim':
      return t('motorResumoFim', { divida: trilhoes(etapa.saidas.dividaBi), caixa: trilhoes(etapa.saidas.caixaBi), qualidade: num(etapa.saidas.qualidadeServicos, 0) })
  }
}
