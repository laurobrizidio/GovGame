import classes from '../../../../data/2025/classes.json'
import ministerios from '../../../../data/2025/ministerios.json'
import subsidios from '../../../../data/2025/subsidios.json'
import segmentos from '../../../../data/2025/segmentos.json'
import coeficientes from '../../../../data/2025/coeficientes.json'
import iniciais from '../../../../data/2025/iniciais.json'
import { classeSchema, instrumentoSchema, ministerioSchema, parametrosSchema, setorSchema, type Parametros } from './schema'

export { decisoesSchema } from './schema'
export const CLASSES = classeSchema.options
export const MINISTERIOS = ministerioSchema.options
export const SETORES = setorSchema.options
export const INSTRUMENTOS = instrumentoSchema.options

const chaves = {
  turno: ['mandatoMeses', 'anoMeses', 'carenciaMeses', 'historicoMensal', 'historicoIncentivos', 'aprovacaoImpeachment', 'mesesImpeachment', 'mesesCalote', 'mesesHiperinflacao', 'ipcaHiperinflacaoMensal', 'notaAprovacaoPeso', 'notaAprovacaoPior', 'notaAprovacaoMelhor', 'notaDividaPeso', 'notaDividaPior', 'notaDividaMelhor', 'notaQualidadePeso', 'notaQualidadePior', 'notaQualidadeMelhor', 'notaPibPeso', 'notaPibPior', 'notaPibMelhor', 'notaIpcaPeso', 'notaIpcaPior', 'notaIpcaMelhor', 'notaDesempregoPeso', 'notaDesempregoPior', 'notaDesempregoMelhor'],
  ir: ['lafferLimiar', 'lafferPerdaPorPp', 'lafferPiso', 'consumoPib', 'consumoIpca', 'fugaPorPp', 'sensibilidadeBase', 'sensibilidadeDemais', 'injusticaPorPp', 'eficienciaMinima', 'aliquotaMaxima'],
  orcamento: ['riscoFaixaBaixa', 'riscoFaixaAlta', 'riscoMaximo', 'premioFaixaAlta', 'premioMaximo', 'pesoPrimario', 'pesoDivida', 'pesoJuros', 'caixaMinimoBi', 'riscoInicioCrise', 'riscoFimCrise', 'vencimentosBi', 'crisePopularidade', 'notaServicoInicial', 'degradacaoInicial', 'degradacaoMaxima', 'recuperacao', 'qualidadePopularidade', 'limiteSlider', 'receitasOutrasBi', 'custoDividaFracaoSelic', 'infraestruturaIpca', 'saudeEducacaoPib'],
  subsidios: ['retornoIntegral', 'retornoMetade', 'taxaRetornoMetade', 'multiplicadorRenuncia', 'multiplicadorSubsidio', 'defasagemPib', 'agroIpca', 'energiaIpca', 'custoPoliticoRenuncia'],
  bc: ['reuniaoIntervalo', 'passoSelic', 'movimentoMaximo', 'fracaoMovimento', 'selicMinima', 'selicMaxima', 'alvoIpca', 'alvoPib', 'alvoPremio', 'selicDefasagemCredito', 'creditoSelic', 'creditoPib', 'creditoInadimplencia', 'inadimplenciaMediaSelic', 'inadimplenciaSelic', 'inadimplenciaDesemprego', 'inadimplenciaAproximacao', 'inadimplenciaAperto', 'creditoEmAperto', 'altaDolarIntervencaoPct', 'vendaReservasPorPpUsdBi', 'fracaoMaxVendaReservas', 'rendimentoReservas', 'reservasLimiarUsdBi', 'premioReservas', 'impulsoCreditoPib', 'pixAnualBi', 'pixTransacoesBi', 'cartoesAnualBi', 'cartoesTransacoesBi', 'compulsorioVistaPct'],
  macro: ['pibMensalBase', 'pibPotencial', 'pibMensalReferenciaBi', 'selicMediaMeses', 'selicFreio', 'ipcaInercia', 'ipcaMetaPeso', 'ipcaMetaMensal', 'ipcaMetaAnual', 'ipcaControladaLimite', 'ipcaGalopanteLimiar', 'ipcaSuperinflacaoLimiar', 'ipcaHistoricoAproximado', 'ipcaDemanda', 'ipcaDolar', 'dolarPremio', 'dolarFuga', 'dolarSelic', 'dolarIpca', 'dolarAproximacao', 'gastoMultiplicador', 'gastoDefasagem', 'dolarPib', 'dolarPibDefasagem'],
  social: ['inerciaAprovacao', 'miseraAprovacao', 'apertoIpcaInicio', 'apertoIpcaFim', 'apertoDesempregoInicio', 'apertoDesempregoFim', 'miseraIr', 'miseraInadimplencia', 'miseraProtecao', 'miseraSaude', 'okun', 'desempregoPiso', 'satisfacaoInicial', 'satisfacaoMultiplicador', 'inerciaSegmentos', 'unidadeSelic', 'unidadeDolar', 'unidadeGasto', 'unidadeRisco', 'unidadeDivida', 'unidadeFuga', 'pressaoEntrada', 'pressaoSaida', 'pressaoTeto', 'pressaoCusto'],
} as const
type Motor = keyof typeof chaves
type Chave<M extends Motor> = typeof chaves[M][number]

const opcionais = new Set([
  'orcamento.infraestruturaIpca', 'orcamento.saudeEducacaoPib',
  'subsidios.multiplicadorSubsidio', 'subsidios.agroIpca', 'subsidios.energiaIpca', 'subsidios.custoPoliticoRenuncia',
  'bc.impulsoCreditoPib',
])
const inteirosPositivos = new Set([
  'turno.mandatoMeses', 'turno.anoMeses', 'turno.historicoMensal', 'turno.historicoIncentivos',
  'turno.carenciaMeses', 'turno.mesesImpeachment', 'turno.mesesCalote', 'turno.mesesHiperinflacao',
  'subsidios.defasagemPib', 'bc.reuniaoIntervalo', 'bc.selicDefasagemCredito', 'bc.inadimplenciaMediaSelic',
  'macro.selicMediaMeses', 'macro.gastoDefasagem', 'macro.dolarPibDefasagem', 'social.pressaoTeto',
])
const divisoresPositivos = new Set([
  'macro.pibMensalReferenciaBi', 'bc.passoSelic', 'bc.vendaReservasPorPpUsdBi',
  'social.unidadeSelic', 'social.unidadeDolar', 'social.unidadeGasto', 'social.unidadeRisco',
  'social.unidadeDivida', 'social.unidadeFuga',
])
const fracoes = new Set([
  'ir.lafferPiso', 'ir.eficienciaMinima',
  'orcamento.pesoPrimario', 'orcamento.pesoDivida', 'orcamento.pesoJuros',
  'subsidios.taxaRetornoMetade', 'bc.fracaoMovimento', 'bc.inadimplenciaAproximacao',
  'bc.creditoEmAperto', 'bc.fracaoMaxVendaReservas', 'macro.ipcaInercia', 'macro.ipcaMetaPeso',
  'macro.dolarAproximacao', 'social.inerciaAprovacao', 'social.inerciaSegmentos',
])
const componentesNota = {
  Aprovacao: 1, Divida: -1, Qualidade: 1, Pib: 1, Ipca: -1, Desemprego: -1,
} as const

const baseSchema = parametrosSchema.superRefine((params, ctx) => {
  const registrar = (grupo: string, chave: string, message: string) => {
    ctx.addIssue({ code: 'custom', path: ['coeficientes', grupo, chave], message: `${grupo}.${chave}: ${message}` })
  }
  let faltamObrigatorios = false
  for (const grupo of Object.keys(chaves) as Motor[]) {
    for (const chave of chaves[grupo]) {
      const id = `${grupo}.${chave}`
      const entrada = params.coeficientes[grupo]?.[chave]
      if (!entrada || (entrada.valor === null && !opcionais.has(id))) {
        registrar(grupo, chave, 'Coeficiente obrigatório ausente')
        faltamObrigatorios = true
        continue
      }
      const valor = entrada.valor
      if (valor !== null && ((inteirosPositivos.has(id) && (!Number.isSafeInteger(valor) || valor <= 0))
        || (divisoresPositivos.has(id) && valor <= 0) || (fracoes.has(id) && (valor < 0 || valor > 1)))) {
        registrar(grupo, chave, 'Coeficiente fora do intervalo')
      }
    }
  }
  if (faltamObrigatorios) return

  const anoMeses = coef(params, 'turno', 'anoMeses')
  const janela = coef(params, 'turno', 'historicoMensal')
  if (anoMeses < 2 || janela < Math.max(anoMeses, coef(params, 'bc', 'inadimplenciaMediaSelic'),
    coef(params, 'bc', 'selicDefasagemCredito'), coef(params, 'macro', 'selicMediaMeses'), coef(params, 'macro', 'dolarPibDefasagem'))) {
    registrar('turno', 'historicoMensal', 'Janela insuficiente para os cálculos mensais')
  }
  if (coef(params, 'turno', 'historicoIncentivos') <= coef(params, 'subsidios', 'defasagemPib')) {
    registrar('turno', 'historicoIncentivos', 'Janela deve cobrir dois níveis efetivos separados pela defasagem do PIB')
  }
  if (coef(params, 'orcamento', 'riscoFaixaBaixa') >= coef(params, 'orcamento', 'riscoFaixaAlta')
    || coef(params, 'orcamento', 'riscoFaixaAlta') >= coef(params, 'orcamento', 'riscoMaximo')) {
    registrar('orcamento', 'riscoFaixaAlta', 'Faixas do risco fiscal devem ser crescentes')
  }
  if (coef(params, 'orcamento', 'riscoFimCrise') >= coef(params, 'orcamento', 'riscoInicioCrise')
    || coef(params, 'orcamento', 'riscoInicioCrise') > coef(params, 'orcamento', 'riscoMaximo')) {
    registrar('orcamento', 'riscoInicioCrise', 'Início da crise deve superar o fim e respeitar o teto de risco')
  }
  const pesosRisco = coef(params, 'orcamento', 'pesoPrimario') + coef(params, 'orcamento', 'pesoDivida')
    + coef(params, 'orcamento', 'pesoJuros')
  if (Math.abs(pesosRisco - 1) > 1e-10) {
    registrar('orcamento', 'pesoPrimario', 'Os três pesos do risco fiscal devem somar 1')
  }
  if (coef(params, 'orcamento', 'limiteSlider') < 1) {
    registrar('orcamento', 'limiteSlider', 'O limite do controle deve incluir o valor inicial')
  }
  if (coef(params, 'social', 'apertoIpcaInicio') >= coef(params, 'social', 'apertoIpcaFim')) {
    registrar('social', 'apertoIpcaFim', 'Fim da faixa deve superar o início')
  }
  if (coef(params, 'social', 'apertoDesempregoInicio') >= coef(params, 'social', 'apertoDesempregoFim')) {
    registrar('social', 'apertoDesempregoFim', 'Fim da faixa deve superar o início')
  }
  if (coef(params, 'social', 'pressaoEntrada') >= coef(params, 'social', 'pressaoSaida')) {
    registrar('social', 'pressaoSaida', 'Limiar de saída deve superar o de entrada')
  }
  if (coef(params, 'subsidios', 'retornoIntegral') >= coef(params, 'subsidios', 'retornoMetade')) {
    registrar('subsidios', 'retornoMetade', 'A faixa de retorno parcial deve suceder a de retorno integral')
  }
  const multiplicadorSubsidio = coefOpcional(params, 'subsidios', 'multiplicadorSubsidio')
  if (multiplicadorSubsidio !== null && multiplicadorSubsidio > coef(params, 'subsidios', 'multiplicadorRenuncia')) {
    registrar('subsidios', 'multiplicadorSubsidio', 'O multiplicador do subsídio não pode superar a referência da renúncia')
  }
  if (coef(params, 'bc', 'selicMinima') <= -100
    || coef(params, 'bc', 'selicMinima') > params.iniciais.selicAa
    || coef(params, 'bc', 'selicMaxima') < params.iniciais.selicAa) {
    registrar('bc', 'selicMinima', 'Os limites devem conter a Selic inicial e permitir a conversão mensal')
  }
  if (Math.abs(coef(params, 'macro', 'ipcaInercia') + coef(params, 'macro', 'ipcaMetaPeso') - 1) > 1e-10) {
    registrar('macro', 'ipcaMetaPeso', 'Os pesos da inércia e da meta do IPCA devem somar 1')
  }

  const aliquotaMaxima = coef(params, 'ir', 'aliquotaMaxima')
  if (aliquotaMaxima > 100 || CLASSES.some(classe => params.classes[classe].aliquotaInicialPct > aliquotaMaxima)) {
    registrar('ir', 'aliquotaMaxima', 'O teto deve conter todas as alíquotas iniciais e respeitar 100%')
  }

  let somaPesos = 0
  for (const id of Object.keys(componentesNota) as (keyof typeof componentesNota)[]) {
    const melhor = coef(params, 'turno', `nota${id}Melhor`)
    const pior = coef(params, 'turno', `nota${id}Pior`)
    const peso = coef(params, 'turno', `nota${id}Peso`)
    if ((melhor - pior) * componentesNota[id] <= 0) {
      registrar('turno', `nota${id}Melhor`, 'Os extremos devem ser distintos e seguir a direção da pontuação')
    }
    if (peso < 0 || peso > 1) registrar('turno', `nota${id}Peso`, 'O peso deve ser uma fração entre 0 e 1')
    somaPesos += peso
  }
  if (Math.abs(somaPesos - 1) > 1e-10) registrar('turno', 'notaAprovacaoPeso', 'Os seis pesos da pontuação devem somar 1')
})

export function carregarParametros(dados: unknown): Parametros {
  return baseSchema.parse(dados)
}

export function coefOpcional<M extends Motor>(params: Parametros, grupo: M, chave: Chave<M>): number | null {
  return params.coeficientes[grupo][chave].valor
}

export function coef<M extends Motor>(params: Parametros, grupo: M, chave: Chave<M>): number {
  const valor = coefOpcional(params, grupo, chave)
  if (valor === null) throw new Error(`Coeficiente pendente: ${grupo}.${chave}`)
  return valor
}

export const parametros2025 = carregarParametros({
  versao: '2025.2', classes, ministerios, subsidios, segmentos, coeficientes, iniciais,
})
