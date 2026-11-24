import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CLASSES, INSTRUMENTOS, SETORES, carregarParametros, coef, coeficientesCalibraveis, criarEstadoInicial,
  decisoesIniciais, fecharMes, parametros2025,
  type Decisoes, type GameState, type Parametros, type RegistroMes, type ResultadoDoMes,
} from '@govgame/engine'
import { bots } from './bots'
import { mecanismos } from './mecanismos'

const base = parametros2025
const teste = (estado: GameState, params: Parametros): Decisoes => {
  const decisoes = decisoesIniciais(params)
  const ciclo = estado.mes % 12
  const limite = coef(params, 'orcamento', 'limiteSlider')
  decisoes.aliquotasPct.A = ciclo < 6 ? coef(params, 'ir', 'aliquotaMaxima') : decisoes.aliquotasPct.A
  if (ciclo < 6) {
    decisoes.gastosDiscricionariosBi.infraestrutura = 0
    decisoes.gastosDiscricionariosBi.administracao = 0
  } else {
    decisoes.gastosDiscricionariosBi.infraestrutura *= limite
    decisoes.gastosDiscricionariosBi.administracao *= limite
  }
  for (const setor of SETORES) {
    for (const instrumento of INSTRUMENTOS) {
      if (params.subsidios[setor][instrumento].disponivel) {
        decisoes.incentivosBi[setor][instrumento] *= ciclo < 6 ? 0.5 : limite
      }
    }
  }
  if (estado.mes === 0) decisoes.amortizacaoBi = estado.fiscal.caixaBi
  return decisoes
}
const estrategias = { ...bots, teste }
const indicadores = [
  { id: 'pib', nome: 'PIB real acumulado', unidade: '%', ler: (r: RegistroMes) => r.macro.pibReal12mPct },
  { id: 'pibMes', nome: 'Crescimento real no mês', unidade: '%', ler: (r: RegistroMes) => r.macro.crescimentoPibMensalPct },
  { id: 'pibNominal', nome: 'PIB nominal do mês', unidade: 'R$ bi', ler: (r: RegistroMes) => r.macro.pibNominalMensalBi },
  { id: 'ipca', nome: 'IPCA acumulado', unidade: '%', ler: (r: RegistroMes) => r.macro.ipca12mPct },
  { id: 'ipcaMes', nome: 'IPCA no mês', unidade: '%', ler: (r: RegistroMes) => r.macro.ipcaMensalPct },
  { id: 'selic', nome: 'Selic anual', unidade: '%', ler: (r: RegistroMes) => r.bc.selicAa },
  { id: 'selicAlvo', nome: 'Alvo anual da Selic', unidade: '%', ler: (r: RegistroMes) => r.bc.selicAlvoAa },
  { id: 'dolar', nome: 'Dólar', unidade: 'R$/US$', ler: (r: RegistroMes) => r.macro.dolar },
  { id: 'dolarAlvo', nome: 'Dólar-alvo', unidade: 'R$/US$', ler: (r: RegistroMes) => r.macro.dolarAlvo },
  { id: 'reservas', nome: 'Reservas internacionais', unidade: 'US$ bi', ler: (r: RegistroMes) => r.bc.reservasUsdBi },
  { id: 'vendaReservas', nome: 'Venda de reservas no mês', unidade: 'US$ bi', ler: (r: RegistroMes) => r.bc.vendaReservasUsdBi },
  { id: 'credito', nome: 'Crescimento acumulado do crédito', unidade: '%', ler: (r: RegistroMes) => r.bc.crescimentoCredito12mPct },
  { id: 'inadimplencia', nome: 'Inadimplência', unidade: '%', ler: (r: RegistroMes) => r.bc.inadimplenciaPct },
  { id: 'divida', nome: 'Dívida/PIB', unidade: '%', ler: (r: RegistroMes) => r.fiscal.dividaPibPct },
  { id: 'dividaBi', nome: 'Estoque da dívida', unidade: 'R$ bi', ler: (r: RegistroMes) => r.fiscal.dividaBi },
  { id: 'juros', nome: 'Juros no mês', unidade: 'R$ bi', ler: (r: RegistroMes) => r.fluxo.jurosBi },
  { id: 'primario', nome: 'Resultado primário no mês', unidade: 'R$ bi', ler: (r: RegistroMes) => r.fluxo.resultadoPrimarioBi },
  { id: 'nominal', nome: 'Resultado nominal no mês', unidade: 'R$ bi', ler: (r: RegistroMes) => r.fluxo.resultadoNominalBi },
  { id: 'caixa', nome: 'Caixa do Tesouro', unidade: 'R$ bi', ler: (r: RegistroMes) => r.fiscal.caixaBi },
  { id: 'amortizacao', nome: 'Amortização no mês', unidade: 'R$ bi', ler: (r: RegistroMes) => r.fluxo.amortizacaoBi },
  { id: 'ir', nome: 'Arrecadação mensal do IR', unidade: 'R$ bi', ler: (r: RegistroMes) => r.fluxo.receitaIrBi },
  { id: 'receitas', nome: 'Receita total no mês', unidade: 'R$ bi', ler: (r: RegistroMes) => r.fluxo.receitaTotalBi },
  { id: 'gastos', nome: 'Despesa primária no mês', unidade: 'R$ bi', ler: (r: RegistroMes) => r.fluxo.despesaPrimariaBi },
  { id: 'fuga', nome: 'Fuga de capital do IR', unidade: '', ler: (_r: RegistroMes, t?: ResultadoDoMes) => t?.trace.find(motor => motor.motor === 'ir')?.saidas.fugaCapital ?? 0 },
  { id: 'desemprego', nome: 'Desemprego', unidade: '%', ler: (r: RegistroMes) => r.social.desempregoPct },
  { id: 'efeitoIpcaDesemprego', nome: 'Efeito anualizado do IPCA no desemprego', unidade: 'p.p. ao ano', ler: (r: RegistroMes) => r.social.efeitosDesempregoPpAnual?.ipca ?? null },
  { id: 'consumoEmprego', nome: 'Consumo por efeito do emprego (% do PIB anual)', unidade: '%', ler: (r: RegistroMes) => r.social.consumoEmpregoPctPibAnual ?? null },
  { id: 'miseria', nome: 'Índice de Miséria', unidade: 'pontos', ler: (r: RegistroMes) => r.social.indiceMiseria },
  { id: 'aprovacao', nome: 'Aprovação', unidade: '%', ler: (r: RegistroMes) => r.social.aprovacaoGeral },
  { id: 'servicos', nome: 'Qualidade dos serviços', unidade: 'pontos', ler: (r: RegistroMes) => r.fiscal.qualidadeServicos },
  { id: 'satisfacao', nome: 'Satisfação média dos segmentos', unidade: 'pontos', ler: (r: RegistroMes) => r.social.segmentos.reduce((soma, item) => soma + item.satisfacao, 0) / r.social.segmentos.length },
  { id: 'pressoes', nome: 'Segmentos em pressão', unidade: '', ler: (r: RegistroMes) => r.social.segmentos.filter(s => s.pressionando).length },
  { id: 'pressoesExibidas', nome: 'Pressões exibidas', unidade: '', ler: (r: RegistroMes) => r.social.pressoesExibidas.length },
  { id: 'risco', nome: 'Risco Fiscal', unidade: 'pontos', ler: (r: RegistroMes) => r.fiscal.riscoFiscal },
] as const

function rodada(decidir: typeof bots.passivo, params: Parametros) {
  let estado = criarEstadoInicial(params)
  const series = indicadores.map((): (number | null)[] => [])
  const regimes: string[] = []
  const registrar = (turno?: ResultadoDoMes) => {
    indicadores.forEach(({ ler, id }, i) => {
      const valor = ler(estado, turno)
      if (valor !== null && !Number.isFinite(valor)) throw new RangeError(`Resultado não finito para ${id}`)
      series[i].push(valor === null ? null : Number(valor.toFixed(6)))
    })
    regimes.push(estado.macro.regimeInflacao)
  }
  registrar()
  while (!estado.fimDeJogo) {
    const decisoes = decidir(estado, params)
    const teto = coef(params, 'ir', 'aliquotaMaxima')
    for (const classe of CLASSES) decisoes.aliquotasPct[classe] = Math.min(decisoes.aliquotasPct[classe], teto)
    const turno = fecharMes(estado, decisoes, params)
    estado = turno.proximoEstado
    registrar(turno)
  }
  return { series, regimes, final: estado.fimDeJogo.tipo, mes: estado.mes, nota: estado.fimDeJogo.pontuacao }
}

const inteiros = new Set([
  'mandatoMeses', 'anoMeses', 'carenciaMeses', 'historicoMensal', 'historicoIncentivos',
  'mesesCalote', 'mesesImpeachment', 'mesesHiperinflacao', 'defasagemPib', 'reuniaoIntervalo',
  'selicDefasagemCredito', 'inadimplenciaMediaSelic', 'selicMediaMeses', 'gastoDefasagem',
  'dolarPibDefasagem', 'pressaoTeto',
])

function variante(motor: string, chave: string, entrada: Parametros['coeficientes'][string][string], faixa?: { baixo: number; alto: number }) {
  const { valor } = entrada
  const magnitude = valor === null ? 0 : Math.abs(valor) * 0.2
  const passo = inteiros.has(chave) ? Math.max(1, Math.round(magnitude)) : magnitude || 1
  const valores = faixa ? [faixa.baixo, faixa.alto] : valor === null
    // MotorSubsídios §4 delimita m ≤ 0,14. A varredura usa o limite publicado, não uma nova calibração.
    ? chave === 'multiplicadorSubsidio' ? [coef(base, 'subsidios', 'multiplicadorRenuncia')] : []
    : [valor - Math.sign(valor || 1) * passo, valor + Math.sign(valor || 1) * passo]
  return valores.map(proposto => {
    const novoValor = Number(proposto.toPrecision(12))
    const mudancas: { id: string; valor: number }[] = []
    const candidato = structuredClone(base)
    const mudar = (grupo: string, id: string, numero: number) => {
      const anterior = base.coeficientes[grupo][id]
      if (anterior.valor === numero) return
      candidato.coeficientes[grupo][id] = { ...anterior, valor: numero, status: 'a_confirmar' }
      mudancas.push({ id: `${grupo}.${id}`, valor: numero })
    }
    mudar(motor, chave, novoValor)
    if (motor === 'macro' && (chave === 'ipcaInercia' || chave === 'ipcaMetaPeso')) {
      mudar(motor, chave === 'ipcaInercia' ? 'ipcaMetaPeso' : 'ipcaInercia', 1 - novoValor)
    }
    if ((motor === 'turno' && /^nota.+Peso$/.test(chave))
      || (motor === 'orcamento' && ['pesoPrimario', 'pesoDivida', 'pesoJuros'].includes(chave))) {
      const pesos = Object.keys(base.coeficientes[motor]).filter(id => motor === 'turno' ? /^nota.+Peso$/.test(id) : /^peso/.test(id))
      const fator = (1 - novoValor) / (1 - (valor ?? 0))
      for (const id of pesos) {
        if (id !== chave) mudar(motor, id, (base.coeficientes[motor][id].valor ?? 0) * fator)
      }
    }
    if (chave === 'anoMeses' && novoValor > coef(base, 'turno', 'historicoMensal')) {
      mudar('turno', 'historicoMensal', novoValor)
    }
    if (chave === 'defasagemPib' && novoValor >= coef(base, 'turno', 'historicoIncentivos')) {
      mudar('turno', 'historicoIncentivos', novoValor + 1)
    }
    try {
      const params = carregarParametros(candidato)
      return { valor: novoValor, mudancas, partidas: simular(params) }
    } catch (erro) {
      return { valor: novoValor, mudancas, erro: String(erro instanceof Error ? erro.message : erro) }
    }
  })
}

function simular(params: Parametros) {
  return Object.fromEntries(Object.entries(estrategias).map(([id, decidir]) => [id, rodada(decidir, params)]))
}

function gerar(todos: boolean) {
  const referencia = simular(base)
  const faixas = new Map(coeficientesCalibraveis.map(({ id, faixa }) => [id, faixa]))
  const selecao = todos
    ? Object.entries(base.coeficientes).flatMap(([motor, grupo]) =>
      Object.keys(grupo).map(chave => ({ motor, chave, nome: chave })))
    : coeficientesCalibraveis
  const coeficientes = selecao.map(({ motor, chave, nome }) => {
    const entrada = base.coeficientes[motor]?.[chave]
    const mecanismo = mecanismos[motor]?.[chave]
    if (!entrada || !mecanismo) throw new Error(`Falta valor ou descrição de ${motor}.${chave}`)
    const faixa = faixas.get(`${motor}.${chave}`)
    return { motor, chave, nome, ...entrada, faixa, mecanismo, variantes: variante(motor, chave, entrada, faixa) }
  })
  return { versao: base.versao, referencia, coeficientes, indicadores: indicadores.map(({ id, nome, unidade }) => ({ id, nome, unidade })) }
}

const argumentos = process.argv.slice(2)
const caminho = argumentos.find(argumento => argumento !== '--todos')
const destino = caminho
  ? resolve(caminho)
  : fileURLToPath(new URL('../../../.govgame/sensibilidade.html', import.meta.url))
const relatorio = gerar(argumentos.includes('--todos'))
const modelo = readFileSync(new URL('./painel-sensibilidade.html', import.meta.url), 'utf8')
const dados = JSON.stringify(relatorio).replaceAll('<', '\u005cu003c')
mkdirSync(dirname(destino), { recursive: true })
writeFileSync(destino, modelo.replace('/* DADOS_SIMULADOS */', () => dados))
const cenarios = relatorio.coeficientes.flatMap(item => item.variantes)
const validos = cenarios.filter(item => item.partidas).length
process.stdout.write(`${destino}\n${relatorio.coeficientes.length} coeficientes, ${validos} cenários válidos, ${cenarios.length - validos} rejeitados e ${(validos + 1) * Object.keys(estrategias).length} partidas.\n`)
