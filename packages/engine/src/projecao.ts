import type { Decisoes, GameState, Parametros, ResultadoDoMes } from './estado'
import { fecharMes } from './turno'

export function projetar(estado: GameState, decisoes: Decisoes, meses: number, params: Parametros): { meses: ResultadoDoMes[] } {
  if (!Number.isSafeInteger(meses) || meses < 0) throw new RangeError('horizonteInvalido')
  const resultados: ResultadoDoMes[] = []
  let atual = estado
  for (let i = 0; i < meses && !atual.fimDeJogo; i++) {
    const resultado = fecharMes(atual, i === 0 ? decisoes : atual.decisoes, params)
    resultados.push(resultado)
    atual = resultado.proximoEstado
  }
  return { meses: resultados }
}
