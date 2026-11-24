import { limitar, somar } from '../calculo'
import type {
  BC, Classe, Fluxo, GameState, Macro, Parametros, Popularidade, PorClasse,
  ResultadoMotor, SaidasIR, SaidasSubsidios, Social,
} from '../estado'
import { CLASSES, INSTRUMENTOS, MINISTERIOS, SETORES, coef } from '../params'
import type { IndicadorSocial } from '../params/schema'

type EstadoSocial = Pick<GameState, 'macro' | 'social' | 'fiscal'>
type EntradasSocial = {
  ir: SaidasIR
  subsidios: SaidasSubsidios
  fluxo: Fluxo
  bc: BC
  macro: Macro
  popularidade: readonly Popularidade[]
}

function mediaPorClasse(valores: PorClasse<number>, params: Parametros): number {
  return somar(CLASSES.map(classe => valores[classe] * params.classes[classe].participacaoPct / 100))
}

function porClasse(calcular: (classe: Classe) => number): PorClasse<number> {
  return Object.fromEntries(CLASSES.map(classe => [classe, calcular(classe)])) as PorClasse<number>
}

function razaoVariacaoPct(valor: number, referencia: number): number {
  return (valor / referencia - 1) * 100
}

function efeitoIpcaNoDesemprego(ipca12mPct: number, params: Parametros): number {
  const referencia = coef(params, 'social', 'ipcaDesempregoReferenciaPct')
  if (ipca12mPct <= referencia) {
    return (ipca12mPct - referencia) * coef(params, 'social', 'ipcaDesempregoPpAnualPorPp')
  }
  const { pontos } = params.curvaIpcaDesemprego
  const indice = pontos.findIndex(ponto => ipca12mPct <= ponto.ipcaPct)
  // Acima da maior referência, a curva prolonga a inclinação do último trecho.
  const fim = indice < 0 ? pontos.length - 1 : indice
  const superior = pontos[fim]
  const inferior = pontos[fim - 1] ?? { ipcaPct: referencia, efeitoPpAnual: 0 }
  const proporcao = (ipca12mPct - inferior.ipcaPct) / (superior.ipcaPct - inferior.ipcaPct)
  return inferior.efeitoPpAnual + proporcao * (superior.efeitoPpAnual - inferior.efeitoPpAnual)
}

function desempregoDoMes(estado: EstadoSocial, params: Parametros) {
  const hiato = estado.macro.pibReal12mPct - coef(params, 'macro', 'pibPotencial')
  const efeitoPibAnual = coef(params, 'social', 'okun') * hiato
  const efeitoIpcaAnual = efeitoIpcaNoDesemprego(estado.macro.ipca12mPct, params)
  const variacao = (efeitoPibAnual + efeitoIpcaAnual) / coef(params, 'turno', 'anoMeses')
  const limite = coef(params, 'social', 'desempregoLimitePct')
  const teto = coef(params, 'social', 'desempregoTetoPct')
  const anterior = Math.max(limite, estado.social.desempregoPct)
  const margem = anterior - limite
  const ritmoQueda = limitar(margem / (params.iniciais.desempregoPct - limite), 0, 1)
  return {
    desempregoPct: limitar(anterior + (variacao < 0 ? variacao * ritmoQueda : variacao), limite, teto),
    efeitosDesempregoPpAnual: { pib: efeitoPibAnual, ipca: efeitoIpcaAnual },
  }
}

function consumoEmpregoPctPibAnual(desempregoPct: number, params: Parametros): number {
  const { consumoFamiliasAnualBi, pibAnualBi, desempregoPct: referencia } = params.iniciais
  const sensibilidade = coef(params, 'social', 'consumoEmpregoPctPibAnualPorPp')
  const consumoLinear = (referencia - desempregoPct) * sensibilidade
  const inicioAceleracao = coef(params, 'social', 'consumoEmpregoInicioAceleracaoPct')
  if (desempregoPct >= inicioAceleracao) return consumoLinear

  const limite = coef(params, 'social', 'desempregoLimitePct')
  const progresso = (inicioAceleracao - desempregoPct) / (inicioAceleracao - limite)
  const consumoNoLimite = coef(params, 'social', 'consumoEmpregoAltaNoLimitePct') * consumoFamiliasAnualBi / pibAnualBi
  const consumoLinearNoLimite = (referencia - limite) * sensibilidade
  // O termo quadrático começa em zero e preserva a inclinação na transição.
  return consumoLinear + progresso ** 2 * (consumoNoLimite - consumoLinearNoLimite)
}

function calcularMiseria(
  estado: EstadoSocial,
  entradas: EntradasSocial,
  desempregoPct: number,
  irVariacao: PorClasse<number>,
  params: Parametros,
) {
  const ipca = entradas.macro.ipca12mPct
  const base = ipca + desempregoPct
  const ipcaInicio = coef(params, 'social', 'apertoIpcaInicio')
  const desempregoInicio = coef(params, 'social', 'apertoDesempregoInicio')
  const apertoIpca = limitar((ipca - ipcaInicio) / (coef(params, 'social', 'apertoIpcaFim') - ipcaInicio), 0, 1)
  const apertoDesemprego = limitar((desempregoPct - desempregoInicio) / (coef(params, 'social', 'apertoDesempregoFim') - desempregoInicio), 0, 1)
  const aperto = Math.min(apertoIpca, apertoDesemprego)
  if (aperto === 0) return { indice: base, semInadimplencia: false }

  const mesesAno = coef(params, 'turno', 'anoMeses')
  const protecaoInicial = (params.ministerios.assistencia.inicialAnualBi + params.ministerios.trabalho.inicialAnualBi) / mesesAno
  const protecaoAtual = entradas.fluxo.gastosBi.assistencia + entradas.fluxo.gastosBi.trabalho
  const unidadesProtecao = protecaoInicial > 0
    ? razaoVariacaoPct(protecaoAtual, protecaoInicial) / coef(params, 'social', 'unidadeGasto')
    : 0
  const faltaNotaSaude = coef(params, 'orcamento', 'notaServicoInicial') - estado.fiscal.servicos.saude.nota
  const ajuste = coef(params, 'social', 'miseraIr') * mediaPorClasse(irVariacao, params)
    - coef(params, 'social', 'miseraProtecao') * unidadesProtecao
    + coef(params, 'social', 'miseraSaude') * faltaNotaSaude

  // O MotorBC calcula inadimplência total. O ajuste requer a série de famílias.
  return { indice: base + aperto * ajuste, semInadimplencia: true }
}

function unidadesVariacao(
  estado: EstadoSocial,
  entradas: EntradasSocial,
  desempregoPct: number,
  irVariacao: PorClasse<number>,
  params: Parametros,
): Map<IndicadorSocial, number> {
  const { iniciais } = params
  const mesesAno = coef(params, 'turno', 'anoMeses')
  const unidadeGasto = coef(params, 'social', 'unidadeGasto')
  const { riscoFiscal, dividaPibPct } = estado.fiscal
  const unidades = new Map<IndicadorSocial, number>([
    ['ipca', entradas.macro.ipca12mPct - iniciais.ipca12mPct],
    ['desemprego', desempregoPct - iniciais.desempregoPct],
    ['pib', entradas.macro.pibReal12mPct - iniciais.pibReal12mPct],
    ['selic', (entradas.bc.selicAa - iniciais.selicAa) / coef(params, 'social', 'unidadeSelic')],
    ['dolar', razaoVariacaoPct(entradas.macro.dolar, iniciais.dolar) / coef(params, 'social', 'unidadeDolar')],
    ['inadimplencia', entradas.bc.inadimplenciaPct - iniciais.inadimplenciaPct],
    ['divida', (dividaPibPct - iniciais.dividaBi / iniciais.pibAnualBi * 100) / coef(params, 'social', 'unidadeDivida')],
    ['fuga', entradas.ir.fugaCapital / coef(params, 'social', 'unidadeFuga')],
  ])
  if (riscoFiscal !== null && iniciais.riscoFiscal !== null) {
    unidades.set('risco', (riscoFiscal - iniciais.riscoFiscal) / coef(params, 'social', 'unidadeRisco'))
  }
  for (const classe of CLASSES) unidades.set(`ir.${classe}`, irVariacao[classe])
  for (const ministerio of MINISTERIOS) {
    const inicialBi = params.ministerios[ministerio].inicialAnualBi / mesesAno
    if (inicialBi > 0) {
      unidades.set(`gasto.${ministerio}`, razaoVariacaoPct(entradas.fluxo.gastosBi[ministerio], inicialBi) / unidadeGasto)
    }
  }
  for (const setor of SETORES) {
    const instrumentos = INSTRUMENTOS.filter(instrumento => params.subsidios[setor][instrumento].disponivel)
    const inicialAnualBi = somar(instrumentos.map(instrumento => params.subsidios[setor][instrumento].inicialAnualBi ?? 0))
    if (inicialAnualBi > 0) {
      const atualBi = somar(instrumentos.map(instrumento => entradas.subsidios.nivelEfetivoBi[setor][instrumento]))
      unidades.set(`incentivo.${setor}`, razaoVariacaoPct(atualBi, inicialAnualBi / mesesAno) / unidadeGasto)
    }
  }
  return unidades
}

function atualizarSegmentos(
  estado: EstadoSocial,
  unidades: ReadonlyMap<IndicadorSocial, number>,
  params: Parametros,
): Social['segmentos'] {
  const base = coef(params, 'social', 'satisfacaoInicial')
  const multiplicador = coef(params, 'social', 'satisfacaoMultiplicador')
  const inercia = coef(params, 'social', 'inerciaSegmentos')
  const limiarEntrada = coef(params, 'social', 'pressaoEntrada')
  const limiarSaida = coef(params, 'social', 'pressaoSaida')
  const anteriores = new Map(estado.social.segmentos.map(segmento => [segmento.id, segmento]))

  return params.segmentos.map(({ id, variaveis }) => {
    const anterior = anteriores.get(id)
    const notaAnterior = anterior?.satisfacao ?? base
    const alvo = base + multiplicador * somar(variaveis.map(({ indicador, peso }) => (unidades.get(indicador) ?? 0) * peso))
    const satisfacao = limitar(notaAnterior + inercia * (alvo - notaAnterior), 0, 100)
    return { id, satisfacao, pressionando: satisfacao < (anterior?.pressionando ? limiarSaida : limiarEntrada) }
  })
}

export function motorSocial(estado: EstadoSocial, entradas: EntradasSocial, params: Parametros): ResultadoMotor<Social> {
  const avisos: ResultadoMotor<Social>['avisos'] = []
  const { desempregoPct, efeitosDesempregoPpAnual } = desempregoDoMes(estado, params)
  const irVariacao = porClasse(classe => entradas.ir.aliquotasVigentesPct[classe] - params.classes[classe].aliquotaInicialPct)
  const { indice: indiceMiseria, semInadimplencia } = calcularMiseria(estado, entradas, desempregoPct, irVariacao, params)
  if (semInadimplencia) avisos.push({ codigo: 'inadimplenciaFamiliarPendente', params: {} })

  const unidades = unidadesVariacao(estado, entradas, desempregoPct, irVariacao, params)
  if (!unidades.has('risco')) avisos.push({ codigo: 'riscoSegmentoPendente', params: {} })
  const segmentos = atualizarSegmentos(estado, unidades, params)
  const pressoes = segmentos.filter(segmento => segmento.pressionando).sort((a, b) => a.satisfacao - b.satisfacao)
  const tetoPressao = coef(params, 'social', 'pressaoTeto')
  const excessoPressao = Math.max(0, pressoes.length - tetoPressao)
  const custoPressao = excessoPressao * coef(params, 'social', 'pressaoCusto')

  const miseriaInicial = params.iniciais.ipca12mPct + params.iniciais.desempregoPct
  const efeitoMiseria = -coef(params, 'social', 'miseraAprovacao') * (indiceMiseria - miseriaInicial)
  const inercia = coef(params, 'social', 'inerciaAprovacao')
  const deltaPorClasse = porClasse(classe =>
    (entradas.ir.efeitoPorClasse[classe] + efeitoMiseria - estado.social.efeitosNivelPorClasse[classe]) * inercia,
  )
  const efeitosNivelPorClasse = porClasse(classe => estado.social.efeitosNivelPorClasse[classe] + deltaPorClasse[classe])

  const fluxoAprovacao = somar(entradas.popularidade.map(({ delta }) => delta)) - custoPressao
  const aprovacaoAnterior = estado.social.aprovacaoPorClasse
  const aprovacaoPorClasse = aprovacaoAnterior && porClasse(classe =>
    limitar(aprovacaoAnterior[classe] + deltaPorClasse[classe] + fluxoAprovacao, 0, 100),
  )
  if (aprovacaoPorClasse === null) avisos.push({ codigo: 'aprovacaoInicialPendente', params: {} })

  const deltaNivel = mediaPorClasse(deltaPorClasse, params)
  const popularidade: Popularidade[] = []
  if (deltaNivel !== 0) popularidade.push({ origem: 'social', delta: deltaNivel, rotulo: 'efeitoNivelSocial' })
  if (custoPressao > 0) popularidade.push({ origem: 'social', delta: -custoPressao, rotulo: 'custoPressoes' })

  return {
    saidas: {
      aprovacaoGeral: aprovacaoPorClasse && mediaPorClasse(aprovacaoPorClasse, params),
      aprovacaoPorClasse,
      efeitosNivelPorClasse,
      desempregoPct,
      efeitosDesempregoPpAnual,
      consumoEmpregoPctPibAnual: consumoEmpregoPctPibAnual(desempregoPct, params),
      indiceMiseria,
      segmentos,
      pressoesExibidas: pressoes.slice(0, tetoPressao).map(segmento => segmento.id),
    },
    impulsos: [],
    popularidade,
    avisos,
  }
}
