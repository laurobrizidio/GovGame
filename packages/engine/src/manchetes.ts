import type { GameState, Mensagem, SaidasIR } from './estado'

export function manchetesDoMes(estado: GameState, ir: SaidasIR): Mensagem[] {
  const manchetes: Mensagem[] = []
  if (estado.fimDeJogo) manchetes.push({ codigo: `final.${estado.fimDeJogo.tipo}`, params: {} })
  if (estado.fiscal.criseRolagem) manchetes.push({ codigo: 'criseRolagem', params: {} })
  if (ir.penalidadeInjustica < 0) manchetes.push({ codigo: 'mancheteRegressividade', params: {} })
  for (const segmento of estado.social.pressoesExibidas) {
    manchetes.push({ codigo: `pressao.${segmento}`, params: {} })
  }
  return manchetes
}
