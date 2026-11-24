import type { Vigencia } from './estado'

export function apurarVigencia(
  vigente: number,
  fila: Vigencia | undefined,
  solicitado: number,
  mes: number,
  carencia: number,
  adiar: (variacao: number) => boolean,
): { vigente: number; fila?: Vigencia } {
  if (fila && fila.mes <= mes) vigente = fila.valor
  if (solicitado === vigente) return { vigente }
  if (!adiar(solicitado - vigente)) return { vigente: solicitado }
  return {
    vigente,
    fila: fila?.valor === solicitado && fila.mes > mes ? fila : { valor: solicitado, mes: mes + carencia },
  }
}
