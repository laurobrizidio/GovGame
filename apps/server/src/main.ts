import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parametros2025 } from '@govgame/engine'
import { criarServidor } from './app'
import { abrirRepositorio } from './repositorio'

const diretorio = fileURLToPath(new URL('../../../.govgame/', import.meta.url))
const banco = process.env.GOVGAME_DB_PATH ?? join(diretorio, 'partidas.sqlite')
mkdirSync(dirname(banco), { recursive: true })
const app = criarServidor(abrirRepositorio(banco, parametros2025), true)
try {
  await app.listen({ host: '127.0.0.1', port: 3001 })
} catch (error) {
  app.log.error(error)
  await app.close()
  process.exitCode = 1
}
