import { describe, expect, it } from 'vitest'
import { agenda, carregarParametros, criarEstadoInicial, fecharMes, parametros2025 as params, preview, projetar } from './index'
import { intervirNoDolar, motorBC } from './motores/bc'
import { premioPorRisco } from './motores/orcamento'

describe('mandato de 2025', () => {
  // data/AGENTS.md; MotorBC §2.
  it('rejeita configuração inválida na inicialização e usa o teto de IR da base', () => {
    const invalida = structuredClone(params)
    invalida.coeficientes.bc.passoSelic.valor = 0
    expect(() => carregarParametros(invalida)).toThrow('bc.passoSelic')
    const alternativa = structuredClone(params)
    alternativa.coeficientes.ir.aliquotaMaxima.valor = 42
    const estado = criarEstadoInicial(alternativa)
    const decisoes = structuredClone(estado.decisoes)
    decisoes.aliquotasPct.A = 41
    expect(() => preview(estado, decisoes, alternativa)).not.toThrow()
    expect(() => preview(estado, decisoes, params)).toThrow('aliquotaForaLimite:A')
  })

  // MotorTurno §2; MotorIR §6; MotorMacro §3; MotorBC §2.
  it('conserva o estado de entrada e reproduz os números iniciais documentados', () => {
    const estado = criarEstadoInicial(params)
    const copia = structuredClone(estado)
    const previa = preview(estado, estado.decisoes, params)
    const { trace, proximoEstado } = fecharMes(estado, estado.decisoes, params)
    expect(estado).toEqual(copia)
    expect(trace.map(({ motor }) => motor)).toEqual(['ir', 'subsidios', 'orcamento', 'bc', 'macro', 'social', 'fim'])
    expect(previa.fluxo).toEqual(proximoEstado.fluxo)
    expect(previa.ir.arrecadacaoBi).toBeCloseTo(35.05)
    expect(proximoEstado.bc.selicAa).toBe(15)
    expect(proximoEstado.macro.ipca12mPct).toBeCloseTo(4.26, 1)
    expect(proximoEstado.fiscal.riscoFiscal).toBeNull()
    expect(estado.social.aprovacaoPorClasse).toEqual({ E: 55, D: 55, C: 55, B: 55, A: 55 })
    expect(estado.social.aprovacaoGeral).toBeCloseTo(55)
    expect(proximoEstado.social.aprovacaoGeral).toBeTypeOf('number')
  })

  // MotorIR §§3.1, 4.1, 5.
  it('aplica Laffer depois de dois turnos de carência e anuncia o efeito político já no primeiro', () => {
    const estado = criarEstadoInicial(params)
    const decisoes = structuredClone(estado.decisoes)
    decisoes.aliquotasPct.A = 40
    const primeiros = projetar(estado, decisoes, 3, params).meses
    const ir = primeiros[0].trace.find(resultado => resultado.motor === 'ir')!.saidas
    expect(ir.efeitoPorClasse.A).toBeCloseTo(-10.625)
    expect(primeiros.map(({ proximoEstado }) => proximoEstado.aliquotasVigentesPct.A)).toEqual([27.5, 27.5, 40])
    expect(agenda(primeiros[0].proximoEstado, params)).toContainEqual({
      mes: 3, mensagem: { codigo: 'vigenciaIr', params: { classe: 'A', valor: 40 } },
    })
    expect(primeiros[2].proximoEstado.fluxo.receitaIrBi).toBeCloseTo(35.05 - 12.1 + 44 * 0.4 * 0.82)
  })

  // MotorSubsídios §§4–5.
  it('leva um corte de renúncia ao caixa no mês três e ao PIB no mês cinco', () => {
    const estado = criarEstadoInicial(params)
    const decisoes = structuredClone(estado.decisoes)
    decisoes.incentivosBi.agro.renuncia *= 0.9
    const meses = projetar(estado, decisoes, 5, params).meses
    expect(meses[1].proximoEstado.fluxo.variacaoRenunciasBi).toBeCloseTo(0)
    expect(meses[2].proximoEstado.fluxo.variacaoRenunciasBi).toBeCloseTo(69.4 / 12 * 0.1)
    const impactos = meses.map(mes => mes.trace.find(resultado => resultado.motor === 'subsidios')!.saidas.impulsoPibPct)
    expect(impactos.slice(0, 4)).toEqual([0, 0, 0, 0])
    expect(impactos[4]).toBeCloseTo(-0.14 * 69.4 / 12 * 0.1 / 1060 * 100)
  })

  // MotorOrçamento §§6, 10–12.
  it('protege o mínimo obrigatório e o mínimo do Caixa e degrada serviços nas demais pastas', () => {
    const estado = criarEstadoInicial(params)
    const decisoes = structuredClone(estado.decisoes)
    decisoes.gastosDiscricionariosBi.saude = 0
    decisoes.gastosDiscricionariosBi.educacao = 0
    decisoes.gastosDiscricionariosBi.administracao = 0
    decisoes.amortizacaoBi = 400
    const { meses } = projetar(estado, decisoes, 3, params)
    expect(meses[0].proximoEstado.fluxo.amortizacaoBi).toBe(190)
    expect(meses[0].proximoEstado.fiscal.caixaBi).toBe(1000)
    expect(meses[1].proximoEstado.fluxo.amortizacaoBi).toBe(0)
    for (const { proximoEstado } of meses) {
      expect(proximoEstado.fiscal.servicos.saude.abaixoPiso).toBe(false)
      expect(proximoEstado.fiscal.servicos.educacao.abaixoPiso).toBe(false)
    }
    expect(meses.map(({ proximoEstado }) => proximoEstado.fiscal.servicos.administracao.nota)).toEqual([98, 94, 86])
    for (const { proximoEstado } of meses) expect(proximoEstado.fluxo.receitaIrBi).toBeCloseTo(35.05)
  })

  // MotorOrçamento §7; MotorBC §§2, 5.
  it('reproduz o prêmio por faixa de risco, cadência do BC e limite de venda de reservas', () => {
    const estado = criarEstadoInicial(params)
    expect(premioPorRisco(50, params)).toBeCloseTo(0.4286)
    expect(premioPorRisco(85, params)).toBe(2.5)
    const inflacao = { ...estado, macro: { ...estado.macro, ipca12mPct: 9 } }
    expect(motorBC(inflacao, params).saidas.selicAa).toBe(15)
    expect(motorBC({ ...inflacao, mes: 1 }, params).saidas.selicAa).toBe(16)
    const intervencao = intervirNoDolar(estado, estado.bc, 7, params)
    expect(intervencao.bc.vendaReservasUsdBi).toBeCloseTo(35.823)
    expect(intervencao.dolar).toBeLessThan(7)
  })

  // MotorTurno §4, §7.
  it('termina após 48 turnos e calcula a nota com a aprovação de referência', () => {
    const estado = criarEstadoInicial(params)
    const { meses } = projetar(estado, estado.decisoes, 50, params)
    expect(meses).toHaveLength(48)
    expect(meses.at(-1)?.fimDeJogo).toEqual({ tipo: 'mandato', pontuacao: expect.any(Number) })
  })
})
