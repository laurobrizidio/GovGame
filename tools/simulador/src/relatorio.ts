import {
  coef, criarEstadoInicial, fecharMes, type Parametros,
} from '@govgame/engine'
import { bots } from './bots'

type ParametroProvisorio = {
  parametro: string
  status: 'a_confirmar' | 'pendente'
  fonte: string
  valor: number | null
}

const pendenciasPorAviso: Record<string, readonly (readonly [motor: string, chave: string])[]> = {
  macroCreditoPibPendente: [['bc', 'impulsoCreditoPib']],
  macroInfraestruturaIpcaPendente: [['orcamento', 'infraestruturaIpca']],
  macroSaudeEducacaoPibPendente: [['orcamento', 'saudeEducacaoPib']],
  multiplicadorSubsidioPendente: [['subsidios', 'multiplicadorSubsidio']],
  incentivosIpcaPendente: [['subsidios', 'agroIpca'], ['subsidios', 'energiaIpca']],
  politicaRenunciaPendente: [['subsidios', 'custoPoliticoRenuncia']],
}

function comRastreamento(params: Parametros) {
  const consultas = new Map<string, ParametroProvisorio>()
  const coeficientes = Object.fromEntries(Object.entries(params.coeficientes).map(([motor, grupo]) => [
    motor,
    Object.fromEntries(Object.entries(grupo).map(([chave, coeficiente]) => [
      chave,
      new Proxy(coeficiente, {
        get(alvo, propriedade, receptor) {
          if (propriedade === 'valor' && alvo.status !== 'confirmado') {
            const parametro = `${motor}.${chave}`
            consultas.set(parametro, { parametro, ...alvo })
          }
          return Reflect.get(alvo, propriedade, receptor)
        },
      }),
    ])),
  ]))
  const subsidios = { ...params.subsidios }
  for (const setor of Object.keys(subsidios) as (keyof typeof subsidios)[]) {
    const incentivos = { ...subsidios[setor] }
    for (const instrumento of Object.keys(incentivos) as (keyof typeof incentivos)[]) {
      incentivos[instrumento] = new Proxy(incentivos[instrumento], {
        get(alvo, propriedade, receptor) {
          if (propriedade === 'inicialAnualBi' && alvo.status !== 'confirmado') {
            const parametro = `subsidios.${setor}.${instrumento}.inicialAnualBi`
            consultas.set(parametro, { parametro, status: alvo.status, fonte: alvo.fonte, valor: alvo.inicialAnualBi })
          }
          return Reflect.get(alvo, propriedade, receptor)
        },
      })
    }
    subsidios[setor] = incentivos
  }
  return { params: { ...params, coeficientes, subsidios }, consultas }
}

export function gerarRelatorio(params: Parametros) {
  return {
    versaoParametros: params.versao,
    criterio: 'Valores nulos indicam dados ou fórmulas indisponíveis. As séries incluem o mês de referência (0).',
    partidas: Object.entries(bots).map(([nome, decidir]) => {
      const { params: configuracao, consultas } = comRastreamento(params)
      let estado = criarEstadoInicial(configuracao)
      const mandatoMeses = coef(configuracao, 'turno', 'mandatoMeses')
      const avisos = new Map<string, number[]>()

      while (!estado.fimDeJogo && estado.mes < mandatoMeses) {
        const resultado = fecharMes(estado, decidir(estado, configuracao), configuracao)
        estado = resultado.proximoEstado
        for (const codigo of new Set(resultado.avisos.map(aviso => aviso.codigo))) {
          const meses = avisos.get(codigo) ?? []
          meses.push(estado.mes)
          avisos.set(codigo, meses)
          for (const [motor, chave] of pendenciasPorAviso[codigo] ?? []) {
            const coeficiente = params.coeficientes[motor]?.[chave]
            if (coeficiente?.status === 'pendente') {
              const parametro = `${motor}.${chave}`
              consultas.set(parametro, { parametro, ...coeficiente })
            }
          }
        }
      }

      const indicadoresIndisponiveis: { indicador: string; motivo: string }[] = []
      if (estado.social.aprovacaoGeral === null) {
        indicadoresIndisponiveis.push({
          indicador: 'aprovacaoPct', motivo: 'A aprovação inicial por classe aguarda definição.',
        })
      }
      if (estado.fiscal.riscoFiscal === null) {
        indicadoresIndisponiveis.push({
          indicador: 'riscoFiscal', motivo: 'As escalas do Risco Fiscal aguardam definição.',
        })
      }
      if (estado.fimDeJogo?.pontuacao === null) {
        indicadoresIndisponiveis.push({
          indicador: 'pontuacao', motivo: 'O cálculo depende da série de aprovação.',
        })
      }

      return {
        bot: nome,
        mesFinal: estado.mes,
        final: estado.fimDeJogo?.tipo ?? null,
        pontuacao: estado.fimDeJogo?.pontuacao ?? null,
        indicadoresIndisponiveis,
        serie: estado.historico.map(({ mes, social, fiscal, fluxo }) => ({
          mes,
          aprovacaoPct: social.aprovacaoGeral,
          dividaPibPct: fiscal.dividaPibPct,
          riscoFiscal: fiscal.riscoFiscal,
          fluxoFiscalEstimado: fluxo.estimado,
        })),
        parametrosProvisorios: [...consultas.values()].sort((a, b) => a.parametro.localeCompare(b.parametro)),
        avisos: [...avisos].map(([codigo, meses]) => ({ codigo, meses })),
      }
    }),
  }
}
