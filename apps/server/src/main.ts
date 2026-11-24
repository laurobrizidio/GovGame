import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parametros2025 } from '@govgame/engine'
import { criarServidor } from './app'
import { abrirCalibracao } from './calibracao'
import { abrirRepositorio } from './repositorio'

const diretorio = fileURLToPath(new URL('../../../.govgame/', import.meta.url))
const modoCalibracao = process.argv.includes('--calibracao')
const pastaCalibracao = join(diretorio, 'calibracao')
const banco = modoCalibracao
  ? join(pastaCalibracao, 'partidas.sqlite')
  : process.env.GOVGAME_DB_PATH ?? join(diretorio, 'partidas.sqlite')
mkdirSync(dirname(banco), { recursive: true })
const calibracao = modoCalibracao ? abrirCalibracao(pastaCalibracao) : undefined
const app = criarServidor(abrirRepositorio(banco, parametros2025, calibracao), true, calibracao)
try {
  await app.listen({ host: '127.0.0.1', port: modoCalibracao ? 3002 : 3001 })
} catch (error) {
  app.log.error(error)
  await app.close()
  process.exitCode = 1
}
