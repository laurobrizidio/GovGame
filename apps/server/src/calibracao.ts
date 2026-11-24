import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { carregarParametros, criarEstadoInicial, ehCoeficienteCalibravel, fecharMes, parametros2025, type Decisoes, type GameState, type Parametros } from '@govgame/engine'

type Alteracao = { motor: string; chave: string; valor: number | null }

export function conferirNumerosDoTurno(resultado: unknown) {
  JSON.stringify(resultado, (_chave: string, valor: unknown) => {
    if (typeof valor === 'number' && !Number.isFinite(valor)) throw new RangeError('resultadoNaoFinito')
    return valor
  })
}

export function abrirCalibracao(diretorio: string) {
  const versoes = join(diretorio, 'versoes')
  const ativo = join(diretorio, 'parametros-ativos.json')
  mkdirSync(versoes, { recursive: true })

  function versionar(base: Parametros, coeficientes: Parametros['coeficientes']) {
    const hash = createHash('sha256').update(JSON.stringify({ ...base, coeficientes })).digest('hex')
    return carregarParametros({ ...base, coeficientes, versao: `${parametros2025.versao}-cal-${hash}` })
  }

  function gravar(params: Parametros) {
    const revisao = join(versoes, `${params.versao}.json`)
    const dados = JSON.stringify(params, null, 2)
    for (const caminho of [revisao, ativo]) {
      writeFileSync(`${caminho}.tmp`, dados)
      renameSync(`${caminho}.tmp`, caminho)
    }
  }

  let atuais = existsSync(ativo)
    ? carregarParametros(JSON.parse(readFileSync(ativo, 'utf8')))
    : versionar(parametros2025, parametros2025.coeficientes)
  if (!existsSync(ativo)) gravar(atuais)

  return {
    parametros: () => atuais,
    descrever: () => ({ parametros: atuais }),
    aplicar(alteracoes: Alteracao[], estado: GameState | null, decisoes: Decisoes) {
      const coeficientes = structuredClone(atuais.coeficientes)
      for (const { motor, chave, valor } of alteracoes) {
        const id = `${motor}.${chave}`
        if (!ehCoeficienteCalibravel(id) || !Object.hasOwn(coeficientes, motor) || !Object.hasOwn(coeficientes[motor], chave)) {
          throw new RangeError(id)
        }
        const entrada = coeficientes[motor][chave]
        if (entrada.valor === valor) continue
        coeficientes[motor][chave] = valor === null
          ? { ...entrada, status: 'pendente', valor }
          : { ...entrada, status: 'a_confirmar', valor }
      }
      // A revisão ativa serve como base para os dados do cenário. O identificador não depende da revisão anterior.
      const novos = versionar({ ...atuais, versao: parametros2025.versao }, coeficientes)
      if (novos.versao === atuais.versao) return
      if (estado?.fimDeJogo) throw new RangeError('mandatoEncerrado')
      const referencia = estado ? { ...estado, versao: novos.versao } : criarEstadoInicial(novos)
      // O save antigo e o rascunho continuam utilizáveis ao recarregar ou ao voltar ao jogo.
      if (estado) conferirNumerosDoTurno(fecharMes(referencia, estado.decisoes, novos))
      conferirNumerosDoTurno(fecharMes(referencia, decisoes, novos))
      gravar(novos)
      atuais = novos
    },
  }
}

export type Calibracao = ReturnType<typeof abrirCalibracao>
