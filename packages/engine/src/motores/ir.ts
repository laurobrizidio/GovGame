import { somar } from '../calculo'
import type { Classe, Decisoes, GameState, Parametros, PorClasse, ResultadoMotor, SaidasIR, Vigencia } from '../estado'
import { CLASSES, coef } from '../params'
import { apurarVigencia } from '../vigencia'

export function calcularArrecadacaoIrClasseBi(classe: Classe, aliquotaPct: number, params: Parametros): number {
  const excesso = Math.max(0, aliquotaPct - coef(params, 'ir', 'lafferLimiar'))
  const eficienciaLaffer = Math.max(coef(params, 'ir', 'lafferPiso'), 1 - excesso * coef(params, 'ir', 'lafferPerdaPorPp'))
  return params.classes[classe].baseTributavelMensalBi * aliquotaPct / 100 * eficienciaLaffer
}

export function motorIR(estado: GameState, decisoes: Decisoes, params: Parametros): ResultadoMotor<SaidasIR> & {
  carencia: Partial<PorClasse<Vigencia>>
} {
  const aliquotas = { ...estado.aliquotasVigentesPct }
  const carencia: Partial<PorClasse<Vigencia>> = {}
  const efeitoPorClasse: PorClasse<number> = { E: 0, D: 0, C: 0, B: 0, A: 0 }
  let consumoBi = 0
  let consumoAnteriorBi = 0
  const arrecadacaoPorClasseBi: PorClasse<number> = { E: 0, D: 0, C: 0, B: 0, A: 0 }

  for (const classe of CLASSES) {
    const dados = params.classes[classe]
    const vigenteAnterior = estado.aliquotasVigentesPct[classe]
    const anunciada = decisoes.aliquotasPct[classe]
    const { vigente, fila } = apurarVigencia(
      vigenteAnterior, estado.carenciaIr[classe], anunciada, estado.mes + 1,
      coef(params, 'turno', 'carenciaMeses'), variacao => variacao > 0,
    )
    aliquotas[classe] = vigente
    if (fila) carencia[classe] = fila
    arrecadacaoPorClasseBi[classe] = calcularArrecadacaoIrClasseBi(classe, vigente, params)
    const baseConsumo = dados.baseTributavelMensalBi * dados.propensaoConsumo / 100
    consumoBi += (dados.aliquotaInicialPct - vigente) * baseConsumo
    consumoAnteriorBi += (dados.aliquotaInicialPct - vigenteAnterior) * baseConsumo
    const chaveSensibilidade = classe === 'E' || classe === 'D' ? 'sensibilidadeBase' : 'sensibilidadeDemais'
    efeitoPorClasse[classe] = (dados.aliquotaInicialPct - anunciada) * coef(params, 'ir', chaveSensibilidade) / 100
  }

  const impulsoPibPct = (consumoBi - consumoAnteriorBi) * coef(params, 'ir', 'consumoPib')
  const impulsoIpcaPct = Math.max(0, consumoBi) * coef(params, 'ir', 'consumoIpca')
  const progressividadePp = decisoes.aliquotasPct.A - somar([decisoes.aliquotasPct.D, decisoes.aliquotasPct.E]) / 2
  const progressividadeInicial = params.classes.A.aliquotaInicialPct
    - somar([params.classes.D.aliquotaInicialPct, params.classes.E.aliquotaInicialPct]) / 2
  const penalidadeInjustica = decisoes.aliquotasPct.A < params.classes.A.aliquotaInicialPct
    ? -Math.max(0, progressividadeInicial - progressividadePp) * coef(params, 'ir', 'injusticaPorPp')
    : 0

  return {
    saidas: {
      arrecadacaoBi: somar(Object.values(arrecadacaoPorClasseBi)),
      arrecadacaoPorClasseBi,
      aliquotasVigentesPct: aliquotas,
      consumoBi,
      impulsoPibPct,
      impulsoIpcaPct,
      fugaCapital: Math.max(0, aliquotas.A - params.classes.A.aliquotaInicialPct) * coef(params, 'ir', 'fugaPorPp'),
      progressividadePp,
      penalidadeInjustica,
      efeitoPorClasse,
    },
    carencia,
    impulsos: [{ fonte: 'irPib', valor: impulsoPibPct }, { fonte: 'irIpca', valor: impulsoIpcaPct }],
    popularidade: penalidadeInjustica < 0
      ? [{ origem: 'ir', delta: penalidadeInjustica, rotulo: 'injusticaTributaria' }]
      : [],
    avisos: CLASSES.filter(classe => carencia[classe] !== undefined)
      .map(classe => ({ codigo: 'carenciaIr', params: { classe, mes: carencia[classe]!.mes } })),
  }
}
