import type { Decisoes, GameState, Parametros, PorIncentivo, ResultadoMotor, SaidasSubsidios, Setor, Vigencia } from '../estado'
import { coef, coefOpcional, SETORES } from '../params'
import { apurarVigencia } from '../vigencia'

function incentivoEfetivo(valor: number, inicial: number, params: Parametros) {
  if (inicial === 0) return 0
  const variacao = (valor - inicial) / inicial
  const integral = coef(params, 'subsidios', 'retornoIntegral')
  const metade = coef(params, 'subsidios', 'retornoMetade')
  const taxaMetade = coef(params, 'subsidios', 'taxaRetornoMetade')
  return inicial * (1 + Math.min(variacao, integral) + Math.max(0, Math.min(variacao, metade) - integral) * taxaMetade)
}

export function incentivosIniciais(params: Parametros): PorIncentivo<number> {
  return Object.fromEntries(SETORES.map(setor => [setor, {
    renuncia: (params.subsidios[setor].renuncia.inicialAnualBi ?? 0) / coef(params, 'turno', 'anoMeses'),
    subsidio: (params.subsidios[setor].subsidio.inicialAnualBi ?? 0) / coef(params, 'turno', 'anoMeses'),
  }])) as PorIncentivo<number>
}

export function motorSubsidios(estado: GameState, decisoes: Decisoes, params: Parametros): ResultadoMotor<SaidasSubsidios> & {
  carencia: Partial<Record<Setor, Vigencia>>
} {
  const iniciais = incentivosIniciais(params)
  const renunciasVigentesBi = { ...estado.renunciasVigentesBi }
  const nivelEfetivoBi = { ...iniciais }
  const carencia: Partial<Record<Setor, Vigencia>> = {}
  let variacaoRenunciasBi = 0
  let subsidiosBi = 0
  const avisos: ResultadoMotor<SaidasSubsidios>['avisos'] = []

  for (const setor of SETORES) {
    const solicitados = decisoes.incentivosBi[setor]
    const { vigente, fila } = apurarVigencia(
      estado.renunciasVigentesBi[setor], estado.carenciaRenuncias[setor], solicitados.renuncia,
      estado.mes + 1, coef(params, 'turno', 'carenciaMeses'), variacao => variacao < 0,
    )
    renunciasVigentesBi[setor] = vigente
    if (fila) {
      carencia[setor] = fila
      avisos.push({ codigo: 'carenciaRenuncia', params: { setor, mes: fila.mes } })
    }
    const reducaoEmVigor = vigente < estado.renunciasVigentesBi[setor]
    if (fila || reducaoEmVigor || solicitados.renuncia < iniciais[setor].renuncia) {
      avisos.push({ codigo: 'politicaRenunciaPendente', params: { setor } })
    }
    variacaoRenunciasBi += iniciais[setor].renuncia - vigente
    subsidiosBi += solicitados.subsidio
    nivelEfetivoBi[setor] = {
      renuncia: incentivoEfetivo(vigente, iniciais[setor].renuncia, params),
      subsidio: incentivoEfetivo(solicitados.subsidio, iniciais[setor].subsidio, params),
    }
  }

  const defasagem = coef(params, 'subsidios', 'defasagemPib')
  const atual = estado.nivelEfetivoIncentivosBi.at(-defasagem) ?? iniciais
  const anterior = estado.nivelEfetivoIncentivosBi.at(-defasagem - 1) ?? iniciais
  let variacaoEfetivaRenuncias = 0
  let variacaoEfetivaSubsidios = 0
  for (const setor of SETORES) {
    variacaoEfetivaRenuncias += atual[setor].renuncia - anterior[setor].renuncia
    variacaoEfetivaSubsidios += atual[setor].subsidio - anterior[setor].subsidio
  }
  const multiplicadorSubsidio = coefOpcional(params, 'subsidios', 'multiplicadorSubsidio')
  if (variacaoEfetivaSubsidios !== 0 && multiplicadorSubsidio === null) {
    avisos.push({ codigo: 'multiplicadorSubsidioPendente', params: {} })
  }
  const impulsoPibPct = (variacaoEfetivaRenuncias * coef(params, 'subsidios', 'multiplicadorRenuncia')
    + variacaoEfetivaSubsidios * (multiplicadorSubsidio ?? 0)) / coef(params, 'macro', 'pibMensalReferenciaBi') * 100
  const impulsoIpcaPct = (['agro', 'energia'] as const).some(setor =>
    nivelEfetivoBi[setor].renuncia !== iniciais[setor].renuncia
    || nivelEfetivoBi[setor].subsidio !== iniciais[setor].subsidio) ? null : 0
  if (impulsoIpcaPct === null) avisos.push({ codigo: 'incentivosIpcaPendente', params: {} })

  return {
    saidas: { variacaoRenunciasBi, subsidiosBi, renunciasVigentesBi, nivelEfetivoBi, impulsoPibPct, impulsoIpcaPct },
    carencia,
    impulsos: [{ fonte: 'incentivosPib', valor: impulsoPibPct }],
    popularidade: [],
    avisos,
  }
}
