import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { criarEstadoInicial, decisoesIniciais, fecharMes, parametros2025, preview } from './index'
import { CLASSES, INSTRUMENTOS, MINISTERIOS, SETORES, coef } from './params'

const params = parametros2025
const mandatoMeses = coef(params, 'turno', 'mandatoMeses')
const fracao = fc.integer({ min: 0, max: 100 }).map(valor => valor / 100)
const tamanhoExato = (length: number) => ({ minLength: length, maxLength: length })
const plano = fc.record({
  aliquotas: fc.array(fracao, tamanhoExato(CLASSES.length)),
  gastos: fc.array(fracao, tamanhoExato(MINISTERIOS.length)),
  incentivos: fc.array(fracao, tamanhoExato(SETORES.length * INSTRUMENTOS.length)),
  amortizacao: fracao,
})

describe('propriedades do fechamento mensal', () => {
  // MotorSocial §1, MotorOrcamento §§4 e 12, MotorSubsídios §5 e MotorTurno §1.
  it('preserva os limites e reconcilia as contas em cada turno com decisões variadas', () => {
    const limite = coef(params, 'orcamento', 'limiteSlider')
    const aliquotaMaxima = coef(params, 'ir', 'aliquotaMaxima')
    const caixaMinimo = coef(params, 'orcamento', 'caixaMinimoBi')

    fc.assert(fc.property(fc.array(plano, tamanhoExato(mandatoMeses)), meses => {
      let estado = criarEstadoInicial(params)
      const renunciasIniciaisBi = estado.renunciasVigentesBi
      for (const mes of meses) {
        if (estado.fimDeJogo) break
        const decisoes = decisoesIniciais(params)
        CLASSES.forEach((classe, i) => { decisoes.aliquotasPct[classe] = aliquotaMaxima * mes.aliquotas[i] })
        MINISTERIOS.forEach((id, i) => { decisoes.gastosDiscricionariosBi[id] *= limite * mes.gastos[i] })
        SETORES.forEach((setor, i) => {
          INSTRUMENTOS.forEach((instrumento, j) => {
            decisoes.incentivosBi[setor][instrumento] *= limite * mes.incentivos[i * INSTRUMENTOS.length + j]
          })
        })
        decisoes.amortizacaoBi = Math.max(0, estado.fiscal.caixaBi - caixaMinimo) * mes.amortizacao

        const { proximoEstado } = fecharMes(estado, decisoes, params)
        const { fluxo, fiscal } = proximoEstado
        const variacaoRenunciasBi = SETORES.reduce((variacao, setor) =>
          variacao + (renunciasIniciaisBi[setor] - proximoEstado.renunciasVigentesBi[setor]), 0)
        const subsidiosDiretosBi = SETORES.reduce((total, setor) => total + decisoes.incentivosBi[setor].subsidio, 0)
        const gastosMinisteriaisBi = Object.values(fluxo.gastosBi).reduce((total, gasto) => total + gasto, 0)
        const receitaSemRenunciasBi = fluxo.receitaIrBi + fluxo.receitaConsumoBi + fluxo.receitaEmpresasBi

        expect(fluxo.variacaoRenunciasBi).toBeCloseTo(variacaoRenunciasBi, 8)
        expect(fluxo.subsidiosBi).toBeCloseTo(subsidiosDiretosBi, 8)
        expect(fluxo.receitaTotalBi).toBeCloseTo(receitaSemRenunciasBi + variacaoRenunciasBi, 8)
        expect(fluxo.despesaPrimariaBi).toBeCloseTo(gastosMinisteriaisBi + fluxo.previdenciaBi + subsidiosDiretosBi, 8)
        expect(fluxo.resultadoPrimarioBi).toBeCloseTo(fluxo.receitaTotalBi - fluxo.despesaPrimariaBi, 8)
        expect(fluxo.resultadoNominalBi).toBeCloseTo(fluxo.resultadoPrimarioBi - fluxo.jurosBi, 8)
        if (!estado.fiscal.criseRolagem) {
          const deficitBi = Math.max(0, -fluxo.resultadoNominalBi)
          const superavitBi = Math.max(0, fluxo.resultadoNominalBi)
          expect(fiscal.dividaBi).toBeCloseTo(estado.fiscal.dividaBi + deficitBi - fluxo.amortizacaoBi, 8)
          expect(fiscal.caixaBi).toBeCloseTo(estado.fiscal.caixaBi + superavitBi - fluxo.amortizacaoBi, 8)
        }

        estado = proximoEstado
        const aprovacoes = estado.social.aprovacaoPorClasse
        expect(aprovacoes).not.toBeNull()
        for (const aprovacao of [estado.social.aprovacaoGeral, ...Object.values(aprovacoes ?? {})]) {
          expect(aprovacao).toBeGreaterThanOrEqual(0)
          expect(aprovacao).toBeLessThanOrEqual(100)
        }
        if (estado.fimDeJogo?.tipo !== 'calote') expect(estado.fiscal.caixaBi).toBeGreaterThanOrEqual(0)
      }
      expect(estado.fimDeJogo).toBeDefined()
    }), { numRuns: 24 })
  })

  // MotorTurno §2 e MotorOrcamento §2–3: o bloco fiscal vem antes de BC, Macro e Social.
  it('mantém as saídas fiscais do preview no fechamento e conserva estado e decisões', () => {
    fc.assert(fc.property(fracao, fracao, (alteracaoIr, alteracaoGasto) => {
      const estado = criarEstadoInicial(params)
      const decisoes = decisoesIniciais(params)
      decisoes.aliquotasPct.C *= alteracaoIr
      decisoes.gastosDiscricionariosBi.trabalho *= alteracaoGasto
      const snapshotEstado = structuredClone(estado)
      const snapshotDecisoes = structuredClone(decisoes)
      const estimativa = preview(estado, decisoes, params)
      const resultado = fecharMes(estado, decisoes, params)
      expect(resultado.trace.map(motor => motor.motor)).toEqual(['ir', 'subsidios', 'orcamento', 'bc', 'macro', 'social', 'fim'])
      expect(resultado.trace[0].saidas).toEqual(estimativa.ir)
      expect(resultado.trace[1].saidas).toEqual(estimativa.subsidios)
      expect(resultado.proximoEstado.fluxo).toEqual(estimativa.fluxo)
      expect(fecharMes(estado, decisoes, params)).toEqual(resultado)
      expect(estado).toEqual(snapshotEstado)
      expect(decisoes).toEqual(snapshotDecisoes)
    }))
  })

  // MotorBC §2, MotorMacro §3 e MotorIR §6: as condições iniciais mantêm a Selic
  // de referência nas primeiras reuniões e a arrecadação e inflação próximas de 2025.
  it('preserva as referências iniciais sem mudar as decisões', () => {
    const inicial = criarEstadoInicial(params)
    const decisoes = decisoesIniciais(params)
    const mes1 = fecharMes(inicial, decisoes, params).proximoEstado
    const mes2 = fecharMes(mes1, decisoes, params).proximoEstado

    for (const estado of [inicial, mes1, mes2]) {
      expect(estado.bc.selicAa).toBe(params.iniciais.selicAa)
      expect(estado.fluxo.receitaIrBi).toBeCloseTo(35.05, 2)
      expect(estado.macro.ipca12mPct).toBeCloseTo(params.iniciais.ipca12mPct, 1)
    }
  })
})
