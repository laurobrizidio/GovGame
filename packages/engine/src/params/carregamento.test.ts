import { describe, expect, it } from 'vitest'
import { carregarParametros, parametros2025 } from './index'

describe('validação da base de parâmetros', () => {
  // MotorOrcamento §§6 e 10. O mínimo de Saúde e Educação é a parcela obrigatória.
  it('rejeita uma parcela obrigatória que permitiria gastar abaixo do piso', () => {
    const dados = structuredClone(parametros2025)
    dados.ministerios.saude.fixoAnualBi -= 1
    expect(() => carregarParametros(dados)).toThrow('Parcela obrigatória deve ser igual ao piso')
  })

  // MotorOrcamento §5. O valor inicial separa as zonas de ajuste e expansão.
  it('rejeita um limite de controle abaixo da referência inicial', () => {
    const dados = structuredClone(parametros2025)
    dados.coeficientes.orcamento.limiteSlider.valor = 0.5
    expect(() => carregarParametros(dados)).toThrow('O limite do controle deve incluir o valor inicial')
  })

  // MotorSubsídios §§3 e 7. A renúncia pendente de Infraestrutura começa sem controle.
  it('rejeita valores positivos em instrumentos indisponíveis e a ativação de dados pendentes', () => {
    const dados = structuredClone(parametros2025)
    const renuncia = dados.subsidios.infraestrutura.renuncia
    renuncia.inicialAnualBi = 1
    expect(() => carregarParametros(dados)).toThrow('Incentivo indisponível deve ter valor inicial nulo')
    renuncia.disponivel = true
    expect(() => carregarParametros(dados)).toThrow('Incentivo disponível exige valor inicial positivo e status confirmado ou a confirmar')
  })

  // MotorSocial §6. Cada variável da tabela recebe peso 1, 2 ou 3 com sinal.
  it('rejeita pesos nulos e indicadores duplicados no mesmo segmento', () => {
    const dados = structuredClone(parametros2025)
    const variaveis = dados.segmentos[0].variaveis
    const primeira = variaveis[0]
    primeira.peso = 0
    expect(() => carregarParametros(dados)).toThrow('Peso deve ser')
    primeira.peso = -3
    variaveis.push({ ...primeira })
    expect(() => carregarParametros(dados)).toThrow('Cada indicador deve aparecer uma vez por segmento')
  })

  // MotorTurno §7. A nota é a soma ponderada de seis componentes em escalas lineares.
  it('rejeita faixas de pontuação degeneradas e pesos que não somam 100%', () => {
    const dados = structuredClone(parametros2025)
    const { turno } = dados.coeficientes
    turno.notaAprovacaoMelhor.valor = turno.notaAprovacaoPior.valor
    expect(() => carregarParametros(dados)).toThrow('turno.notaAprovacaoMelhor')
    turno.notaAprovacaoMelhor.valor = 70
    turno.notaAprovacaoPeso.valor = 0.4
    expect(() => carregarParametros(dados)).toThrow('Os seis pesos da pontuação devem somar 1')
  })

  // MotorBC §5. A venda máxima mensal é uma fração das reservas em estoque.
  it('rejeita uma fração de venda acima de 100%', () => {
    const dados = structuredClone(parametros2025)
    dados.coeficientes.bc.fracaoMaxVendaReservas.valor = 1.1
    expect(() => carregarParametros(dados)).toThrow('bc.fracaoMaxVendaReservas')
  })

  // MotorSubsídios §§4 e 7. O multiplicador direto fica limitado ao da renúncia.
  it('preserva o multiplicador pendente e rejeita calibração acima da referência', () => {
    const dados = structuredClone(parametros2025)
    const { subsidios } = dados.coeficientes
    expect(carregarParametros(dados).coeficientes.subsidios.multiplicadorSubsidio.valor).toBeNull()
    subsidios.multiplicadorSubsidio = { valor: 0.2, status: 'a_confirmar', fonte: 'MotorSubsidios §4' }
    expect(() => carregarParametros(dados)).toThrow('subsidios.multiplicadorSubsidio')
  })

  // data/AGENTS.md. A base é identificada pela versão atribuída aos dados recebidos.
  it('carrega uma versão informada pelos dados sem depender do calendário de 2025', () => {
    const dados = { ...parametros2025, versao: '2026.teste' }
    expect(carregarParametros(dados).versao).toBe(dados.versao)
  })
})
