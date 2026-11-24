import { parametros2025 } from '@govgame/engine'
import { gerarRelatorio } from './relatorio'

process.stdout.write(`${JSON.stringify(gerarRelatorio(parametros2025), null, 2)}\n`)
