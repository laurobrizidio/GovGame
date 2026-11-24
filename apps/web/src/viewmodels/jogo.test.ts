import { criarEstadoInicial, decisoesIniciais, fecharMes, parametros2025, preview } from '@govgame/engine'
import { describe, expect, it } from 'vitest'
import { aliquotasPorClasse, bilhoesPorAno, gastosPorMinisterio, incentivo, resumoIncentivos } from './jogo'
import { t } from './textos'

describe('apresentação das receitas', () => {
  // MotorSubsídios §§3 e 5: entradas anuais e fluxo mensal de renúncias e subsídios.
  it('explicita o período do total e do valor por setor', () => {
    const estado = criarEstadoInicial(parametros2025)
    const decisoes = decisoesIniciais(parametros2025)
    const previa = preview(estado, decisoes, parametros2025)
    expect(resumoIncentivos(previa)).toEqual([
      { rotulo: t('renunciaProjetadaTotal'), valor: 'R$ 19,5 bi/mês' },
      { rotulo: t('subsidioProjetadoTotal'), valor: 'R$ 3,6 bi/mês' },
    ])
    expect(incentivo(estado, decisoes, 'agro', 'renuncia', previa).montante).toBe('R$ 69,4 bi/ano')
  })

  // MotorSubsídios §5: a renúncia em carência ainda conta pela política em vigor no mês.
  it('exibe o mês da entrada do corte e o valor que integra a projeção', () => {
    const estado = criarEstadoInicial(parametros2025)
    const decisoes = decisoesIniciais(parametros2025)
    decisoes.incentivosBi.agro.renuncia = 0
    const previa = preview(estado, decisoes, parametros2025)
    const linha = incentivo(estado, decisoes, 'agro', 'renuncia', previa)
    expect(linha.situacao).toBe(t('vigenciaRenuncia', { mes: 3 }))
    expect(linha.detalhe).toBe(t('renunciaProjetada', { valor: 'R$ 69,4 bi/ano' }))
    expect(linha.impactoDoMes).toBeNull()
    expect(linha.impactoFuturo).toBe('Receita a partir do mês 3 · +R$ 5,78 bi/mês (+R$ 69,4 bi/ano)')
    expect(resumoIncentivos(previa)[0].valor).toBe('R$ 19,5 bi/mês')

    const mes1 = fecharMes(estado, decisoes, parametros2025).proximoEstado
    const mes2 = fecharMes(mes1, decisoes, parametros2025).proximoEstado
    const manterRenuncia = decisoesIniciais(parametros2025)
    const comCorte = preview(mes2, decisoes, parametros2025)
    const semCorte = preview(mes2, manterRenuncia, parametros2025)
    expect(comCorte.fluxo.receitaTotalBi - semCorte.fluxo.receitaTotalBi).toBeCloseTo(69.4 / 12)
    expect(incentivo(mes2, decisoes, 'agro', 'renuncia', comCorte).impactoDoMes)
      .toBe('Receita deste mês · +R$ 5,78 bi (+R$ 69,4 bi/ano)')
  })

  // MotorSubsídios §§3 e 5. O corte do subsídio direto reduz integralmente a despesa primária do mês.
  it('mostra o corte do subsídio do Agro no mês e seu equivalente anual', () => {
    const estado = criarEstadoInicial(parametros2025)
    const decisoes = decisoesIniciais(parametros2025)
    const semCorte = preview(estado, decisoes, parametros2025)
    decisoes.incentivosBi.agro.subsidio = 0
    const comCorte = preview(estado, decisoes, parametros2025)
    expect(comCorte.fluxo.despesaPrimariaBi - semCorte.fluxo.despesaPrimariaBi).toBeCloseTo(-16.9 / 12)
    expect(comCorte.fluxo.receitaTotalBi).toBe(semCorte.fluxo.receitaTotalBi)
    expect(incentivo(estado, decisoes, 'agro', 'subsidio', comCorte).impactoDoMes)
      .toBe('Despesa deste mês · −R$ 1,41 bi (−R$ 16,9 bi/ano)')
    expect(fecharMes(estado, decisoes, parametros2025).proximoEstado.fluxo).toEqual(comCorte.fluxo)
  })

  // MotorIR §5 e MotorTurno §2. A data e a alíquota efetiva vêm da prévia fiscal.
  it('atualiza a arrecadação anunciada até 40% e distingue o valor que entra no Nominal', () => {
    const inicial = criarEstadoInicial(parametros2025)
    const decisoes = decisoesIniciais(parametros2025)
    decisoes.aliquotasPct.C = 40
    const previa = preview(inicial, decisoes, parametros2025)
    const prevista = aliquotasPorClasse(inicial, decisoes, previa).find(linha => linha.classe === 'C')
    expect(prevista).toMatchObject({
      projetada: 15, situacao: t('vigenciaIr', { mes: 3 }),
      arrecadacao: 'R$ 212,54 bi/ano', arrecadacaoNoMes: 'R$ 97,20 bi/ano',
    })
    expect(previa.irAnunciado.arrecadacaoBi).toBeCloseTo(44.662)
    expect(previa.fluxo.resultadoNominalBi).toBeCloseTo(preview(inicial, inicial.decisoes, parametros2025).fluxo.resultadoNominalBi)

    const mes1 = fecharMes(inicial, decisoes, parametros2025).proximoEstado
    const mes2 = fecharMes(mes1, decisoes, parametros2025).proximoEstado
    const previaMes3 = preview(mes2, decisoes, parametros2025)
    const efetiva = aliquotasPorClasse(mes2, decisoes, previaMes3).find(linha => linha.classe === 'C')
    expect(efetiva).toMatchObject({
      projetada: 40, situacao: t('aliquotaMudaNoMes'),
      arrecadacao: 'R$ 212,54 bi/ano', arrecadacaoNoMes: null,
    })
    expect(previaMes3.ir.arrecadacaoBi).toBeCloseTo(44.662)
  })
})

// MotorOrcamento §§6 e 10. Os valores de referência anuais incluem as parcelas obrigatórias.
it('anualiza os gastos e o piso da Saúde para a tabela de ministérios', () => {
  const estado = criarEstadoInicial(parametros2025)
  const decisoes = estado.decisoes
  const previa = preview(estado, decisoes, parametros2025)
  const saude = gastosPorMinisterio(estado, decisoes, previa).find(linha => linha.id === 'saude')!
  expect(bilhoesPorAno(saude.total, 2)).toBe('R$ 241,61 bi/ano')
  expect(bilhoesPorAno(saude.piso, 2)).toBe('R$ 144,97 bi/ano')
  expect(bilhoesPorAno(saude.valor, 2)).toBe('R$ 96,64 bi/ano')
})
