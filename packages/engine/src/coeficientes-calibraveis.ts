import catalogo from '../../../data/2025/calibracao.json'

export const coeficientesCalibraveis = Object.entries(catalogo).flatMap(([grupo, entradas]) =>
  Object.entries(entradas).map(([id, entrada]) => {
    const [motor, chave] = id.split('.')
    const descricao = typeof entrada === 'string' ? { nome: entrada, faixa: undefined } : entrada
    return { id, motor, chave, grupo: grupo as keyof typeof catalogo, ...descricao }
  }),
)

const ids = new Set(coeficientesCalibraveis.map(item => item.id))
export const ehCoeficienteCalibravel = (id: string) => ids.has(id)
