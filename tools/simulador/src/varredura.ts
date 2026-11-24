// Varredura de um coeficiente: roda os bots e centenas de partidas com políticas aleatórias moderadas
// para cada valor testado e mostra o efeito no resultado e na correlação da aprovação com os indicadores.
//
// Uso:  pnpm --filter @govgame/simulador varredura <motor.chave> <v1,v2,...> [--partidas=250] [--semente=2025]
//                                                   [--fixo=motor.chave=valor,motor.chave=valor]
// Ex.:  pnpm --filter @govgame/simulador varredura social.miseraAprovacao 4,8,12,20
//       pnpm --filter @govgame/simulador varredura social.miseraAprovacao 12 --fixo=social.apertoIpcaInicio=3,social.apertoIpcaFim=6
//
// Os valores testados ficam só em memória: `data/2025/coeficientes.json` não é alterado.
// Todo valor sobrescrito passa a constar como `a_confirmar`, porque é experimento, não decisão.
import {
  CLASSES, INSTRUMENTOS, MINISTERIOS, SETORES,
  coef, criarEstadoInicial, decisoesIniciais, fecharMes, parametros2025,
  type Decisoes, type GameState, type Parametros, type RegistroMes,
} from '@govgame/engine'
import { bots } from './bots'

type Sobrescrita = { motor: string; chave: string; valor: number }
type Observacao = { mes: number; aprovacao: number; variaveis: Record<string, number> }

const MES_INICIAL_ANALISE = 7 // as políticas aleatórias terminam a transição aos 6 meses
const MESES_TRANSICAO = 6
const MINIMO_PARTIDAS_POR_MES = 20
const ALIQUOTA_MAXIMA_SORTEIO = 35
const VARIACAO_ALIQUOTA_PP = 5

const indicadores: Record<string, (registro: RegistroMes) => number> = {
  'IPCA 12m': r => r.macro.ipca12mPct,
  'Desemprego': r => r.social.desempregoPct,
  'Índice de Miséria': r => r.social.indiceMiseria,
  'PIB real 12m': r => r.macro.pibReal12mPct,
  'Dólar': r => r.macro.dolar,
  'Dívida/PIB': r => r.fiscal.dividaPibPct,
  'Qualidade dos serviços': r => r.fiscal.qualidadeServicos,
}
const CONTROLE = 'Alíquota A'

function sorteador(semente: number) {
  let estado = semente | 0
  return () => {
    estado = (estado + 0x6D2B79F5) | 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function lerArgumentos(argv: string[]) {
  const posicionais = argv.filter(arg => !arg.startsWith('--'))
  const opcao = (nome: string) => argv.find(arg => arg.startsWith(`--${nome}=`))?.slice(nome.length + 3)
  const [alvo, lista] = posicionais
  if (!alvo || !lista) {
    throw new Error('Uso: varredura <motor.chave> <v1,v2,...> [--partidas=250] [--semente=2025] [--fixo=motor.chave=valor,...]')
  }
  const separar = (texto: string): Sobrescrita[] => texto.split(',').filter(Boolean).map(item => {
    const [caminho = '', valor = ''] = item.split('=')
    const [motor = '', chave = ''] = caminho.split('.')
    return { motor, chave, valor: Number(valor) }
  })
  const [motor = '', chave = ''] = alvo.split('.')
  const valores = lista.split(',').map(Number)
  if (valores.some(valor => !Number.isFinite(valor))) throw new Error(`Valores inválidos: ${lista}`)
  return {
    motor, chave, valores,
    partidas: Number(opcao('partidas') ?? 250),
    semente: Number(opcao('semente') ?? 2025),
    fixos: separar(opcao('fixo') ?? ''),
  }
}

function comCoeficientes(params: Parametros, mudancas: Sobrescrita[]): Parametros {
  const coeficientes = { ...params.coeficientes }
  for (const { motor, chave, valor } of mudancas) {
    const atual = coeficientes[motor]?.[chave]
    if (!atual) throw new Error(`Coeficiente inexistente: ${motor}.${chave}`)
    if (!Number.isFinite(valor)) throw new Error(`Valor inválido para ${motor}.${chave}`)
    coeficientes[motor] = { ...coeficientes[motor], [chave]: { ...atual, status: 'a_confirmar', valor } }
  }
  return { ...params, coeficientes }
}

function jogarBot(decidir: (estado: GameState, params: Parametros) => Decisoes, params: Parametros) {
  let estado = criarEstadoInicial(params)
  while (!estado.fimDeJogo) estado = fecharMes(estado, decidir(estado, params), params).proximoEstado
  return {
    final: estado.fimDeJogo.tipo,
    mes: estado.mes,
    pontuacao: estado.fimDeJogo.pontuacao,
    aprovacaoFinalPct: estado.social.aprovacaoGeral,
  }
}

// Política aleatória moderada: cada alíquota, gasto discricionário e incentivo caminha de forma linear
// do valor inicial até um alvo sorteado, durante a transição, e depois fica parada.
function sortearAlvo(params: Parametros, aleatorio: () => number): Decisoes {
  const base = decisoesIniciais(params)
  const limite = coef(params, 'orcamento', 'limiteSlider')
  const entre = (minimo: number, maximo: number) => minimo + (maximo - minimo) * aleatorio()
  const alvo = structuredClone(base)
  for (const classe of CLASSES) {
    alvo.aliquotasPct[classe] = entre(
      Math.max(0, base.aliquotasPct[classe] - VARIACAO_ALIQUOTA_PP),
      Math.min(ALIQUOTA_MAXIMA_SORTEIO, base.aliquotasPct[classe] + VARIACAO_ALIQUOTA_PP),
    )
  }
  for (const id of MINISTERIOS) alvo.gastosDiscricionariosBi[id] = base.gastosDiscricionariosBi[id] * entre(0.85, limite - 0.05)
  for (const setor of SETORES) {
    for (const instrumento of INSTRUMENTOS) {
      if (params.subsidios[setor][instrumento].disponivel) {
        alvo.incentivosBi[setor][instrumento] = base.incentivosBi[setor][instrumento] * entre(0.5, limite - 0.05)
      }
    }
  }
  return alvo
}

function decisaoDoMes(base: Decisoes, alvo: Decisoes, mes: number): Decisoes {
  const passo = Math.min(1, (mes + 1) / MESES_TRANSICAO)
  const mistura = (inicial: number, final: number) => inicial + (final - inicial) * passo
  const decisoes = structuredClone(base)
  for (const classe of CLASSES) decisoes.aliquotasPct[classe] = mistura(base.aliquotasPct[classe], alvo.aliquotasPct[classe])
  for (const id of MINISTERIOS) {
    decisoes.gastosDiscricionariosBi[id] = mistura(base.gastosDiscricionariosBi[id], alvo.gastosDiscricionariosBi[id])
  }
  for (const setor of SETORES) {
    for (const instrumento of INSTRUMENTOS) {
      decisoes.incentivosBi[setor][instrumento] = mistura(base.incentivosBi[setor][instrumento], alvo.incentivosBi[setor][instrumento])
    }
  }
  return decisoes
}

function jogarAleatorias(params: Parametros, partidas: number, semente: number) {
  const aleatorio = sorteador(semente)
  const base = decisoesIniciais(params)
  const observacoes: Observacao[] = []
  const finais: Record<string, number> = {}
  for (let i = 0; i < partidas; i++) {
    const alvo = sortearAlvo(params, aleatorio)
    let estado = criarEstadoInicial(params)
    while (!estado.fimDeJogo) estado = fecharMes(estado, decisaoDoMes(base, alvo, estado.mes), params).proximoEstado
    finais[estado.fimDeJogo.tipo] = (finais[estado.fimDeJogo.tipo] ?? 0) + 1
    for (const registro of estado.historico) {
      if (registro.mes < MES_INICIAL_ANALISE || registro.social.aprovacaoGeral === null) continue
      observacoes.push({
        mes: registro.mes,
        aprovacao: registro.social.aprovacaoGeral,
        variaveis: {
          ...Object.fromEntries(Object.entries(indicadores).map(([nome, ler]) => [nome, ler(registro)])),
          [CONTROLE]: alvo.aliquotasPct.A,
        },
      })
    }
  }
  return { observacoes, finais }
}

const media = (valores: number[]) => valores.reduce((total, valor) => total + valor, 0) / valores.length

function pearson(x: number[], y: number[]): number | null {
  const mx = media(x)
  const my = media(y)
  let sxy = 0
  let sxx = 0
  let syy = 0
  x.forEach((xi, i) => {
    const dx = xi - mx
    const dy = (y[i] ?? 0) - my
    sxy += dx * dy
    sxx += dx * dx
    syy += dy * dy
  })
  return sxx > 0 && syy > 0 ? sxy / Math.sqrt(sxx * syy) : null
}

// Correlação parcial entre a aprovação e cada indicador, sem a tendência de cada mês
// (centra por mês) e sem o efeito da alíquota da classe A (tira por regressão).
function correlacaoParcial(observacoes: Observacao[]) {
  const porMes = new Map<number, Observacao[]>()
  for (const obs of observacoes) porMes.set(obs.mes, [...(porMes.get(obs.mes) ?? []), obs])
  const nomes = [...Object.keys(indicadores), CONTROLE]
  const centradas: Observacao[] = []
  for (const grupo of porMes.values()) {
    if (grupo.length < MINIMO_PARTIDAS_POR_MES) continue
    const mediaAprovacao = media(grupo.map(obs => obs.aprovacao))
    const mediaVariavel = Object.fromEntries(nomes.map(nome => [nome, media(grupo.map(obs => obs.variaveis[nome] ?? 0))]))
    for (const obs of grupo) {
      centradas.push({
        mes: obs.mes,
        aprovacao: obs.aprovacao - mediaAprovacao,
        variaveis: Object.fromEntries(nomes.map(nome => [nome, (obs.variaveis[nome] ?? 0) - (mediaVariavel[nome] ?? 0)])),
      })
    }
  }
  const controle = centradas.map(obs => obs.variaveis[CONTROLE] ?? 0)
  const somaControle = controle.reduce((total, valor) => total + valor * valor, 0)
  const semControle = (serie: number[]) => {
    const coeficiente = somaControle > 0 ? serie.reduce((total, valor, i) => total + valor * (controle[i] ?? 0), 0) / somaControle : 0
    return serie.map((valor, i) => valor - coeficiente * (controle[i] ?? 0))
  }
  const aprovacao = semControle(centradas.map(obs => obs.aprovacao))
  const desvio = (serie: number[]) => Math.sqrt(media(serie.map(valor => (valor - media(serie)) ** 2)))
  return {
    observacoes: centradas.length,
    parcial: Object.fromEntries(Object.keys(indicadores).map(nome => [nome, pearson(aprovacao, semControle(centradas.map(obs => obs.variaveis[nome] ?? 0)))])),
    desvioPadrao: Object.fromEntries(nomes.map(nome => [nome, desvio(centradas.map(obs => obs.variaveis[nome] ?? 0))])),
  }
}

const arredondar = (valor: number | null) => valor === null ? null : Math.round(valor * 1000) / 1000

function main() {
  const { motor, chave, valores, partidas, semente, fixos } = lerArgumentos(process.argv.slice(2))
  const resultados = valores.map(valor => {
    const params = comCoeficientes(parametros2025, [...fixos, { motor, chave, valor }])
    const { observacoes, finais } = jogarAleatorias(params, partidas, semente)
    const analise = correlacaoParcial(observacoes)
    return {
      valor,
      bots: Object.fromEntries(Object.entries(bots).map(([nome, decidir]) => {
        const resultado = jogarBot(decidir, params)
        return [nome, { ...resultado, pontuacao: arredondar(resultado.pontuacao), aprovacaoFinalPct: arredondar(resultado.aprovacaoFinalPct) }]
      })),
      aleatorias: {
        partidas,
        mandatoCompletoPct: arredondar(100 * (finais.mandato ?? 0) / partidas),
        impeachmentPct: arredondar(100 * (finais.impeachment ?? 0) / partidas),
      },
      correlacaoParcial: Object.fromEntries(Object.entries(analise.parcial).map(([nome, r]) => [nome, arredondar(r)])),
      desvioPadrao: Object.fromEntries(Object.entries(analise.desvioPadrao).map(([nome, d]) => [nome, arredondar(d)])),
      observacoes: analise.observacoes,
    }
  })
  process.stdout.write(`${JSON.stringify({
    versaoParametros: parametros2025.versao,
    coeficiente: `${motor}.${chave}`,
    fixos,
    semente,
    criterio: 'Correlação parcial centrada por mês e controlada pela alíquota da classe A, em partidas aleatórias moderadas '
      + `(alíquotas ±${VARIACAO_ALIQUOTA_PP} p.p., gastos 0,85× a limite, incentivos 0,5× a limite), a partir do mês ${MES_INICIAL_ANALISE}.`,
    resultados,
  }, null, 2)}\n`)
}

main()
