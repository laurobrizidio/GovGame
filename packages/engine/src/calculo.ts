export const limitar = (valor: number, min: number, max: number) => Math.min(max, Math.max(min, valor))
export const somar = (valores: readonly number[]) => valores.reduce((total, valor) => total + valor, 0)
export const media = (valores: readonly number[]) => somar(valores) / valores.length
export const taxaMensal = (taxaAa: number, meses: number) => Math.expm1(Math.log1p(taxaAa / 100) / meses) * 100
export const acumularTaxas = (taxas: number[]) => taxas.reduce((total, taxa) => total * (1 + taxa / 100), 1) * 100 - 100
