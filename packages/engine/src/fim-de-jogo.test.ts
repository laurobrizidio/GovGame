import { describe, expect, it } from 'vitest'
import type { GameState, RegistroMes } from './estado'
import { apurarFimDeJogo } from './fim-de-jogo'
import { criarEstadoInicial } from './inicial'
import { parametros2025 as params } from './params'

function estadoComHistorico(meses: number, aprovacaoGeral: number): GameState {
  const inicial = criarEstadoInicial(params)
  const historico = [inicial.historico[0]]
  for (let mes = 1; mes <= meses; mes++) {
    const registro: RegistroMes = {
      ...inicial.historico[0],
      mes,
      social: { ...inicial.social, aprovacaoGeral, desempregoPct: 4 },
      fiscal: { ...inicial.fiscal, dividaPibPct: 70, qualidadeServicos: 100 },
      macro: { ...inicial.macro, ipca12mPct: 3, pibRealMensalBi: inicial.macro.pibRealMensalBi * 1.04 ** (mes / 12) },
    }
    historico.push(registro)
  }
  return { ...inicial, ...historico[meses], historico }
}

describe('fim de jogo', () => {
  // MotorTurno §7. Cada componente na extremidade melhor vale 100 pontos.
  it('atribui 100 quando as seis metas são cumpridas ao fim do mandato', () => {
    const estado = estadoComHistorico(48, 70)
    const fim = apurarFimDeJogo(estado, params)
    expect(fim?.tipo).toBe('mandato')
    expect(fim?.pontuacao).toBeCloseTo(100)
  })

  // MotorTurno §§4 e 7. Três meses abaixo do limiar encerram a partida e reduzem a nota proporcionalmente.
  it('aplica o peso dos meses cumpridos na pontuação de impeachment', () => {
    const estado = estadoComHistorico(3, 14)
    estado.contadores.mesesAprovacaoBaixa = 2
    expect(apurarFimDeJogo(estado, params)).toBeUndefined()
    estado.contadores.mesesAprovacaoBaixa = 3
    const fim = apurarFimDeJogo(estado, params)
    expect(fim?.tipo).toBe('impeachment')
    expect(fim?.pontuacao).toBeCloseTo(70 * 3 / 48)
  })

  // MotorTurno §4 e MotorOrcamento §12. Os dois gatilhos de calote são independentes.
  it('encerra por Caixa zerado durante a crise ou por três meses de risco máximo', () => {
    const estado = estadoComHistorico(3, 55)
    estado.fiscal = { ...estado.fiscal, caixaBi: 0, criseRolagem: false }
    expect(apurarFimDeJogo(estado, params)).toBeUndefined()
    expect(apurarFimDeJogo({ ...estado, fiscal: { ...estado.fiscal, criseRolagem: true } }, params)?.tipo).toBe('calote')

    estado.fiscal = { ...estado.fiscal, caixaBi: 500, riscoFiscal: 100 }
    estado.contadores.mesesRiscoMaximo = 2
    expect(apurarFimDeJogo(estado, params)).toBeUndefined()
    estado.contadores.mesesRiscoMaximo = 3
    expect(apurarFimDeJogo(estado, params)?.tipo).toBe('calote')
  })

  // MotorTurno §4. O gatilho de hiperinflação depende de três meses seguidos.
  it('só encerra por hiperinflação quando a sequência chega a três meses', () => {
    const estado = estadoComHistorico(3, 55)
    estado.contadores.mesesHiperinflacao = 2
    expect(apurarFimDeJogo(estado, params)).toBeUndefined()
    estado.contadores.mesesHiperinflacao = 3
    expect(apurarFimDeJogo(estado, params)?.tipo).toBe('hiperinflacao')
  })
})
