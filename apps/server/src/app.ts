import Fastify from 'fastify'
import { z } from 'zod'
import { decisoesSchema } from '@govgame/engine'
import { ConflitoDePartida, type RepositorioDePartidas } from './repositorio'

const turnoSchema = z.strictObject({
  geracao: z.number().int().nonnegative(),
  mesAnterior: z.number().int().nonnegative(),
  decisoes: decisoesSchema,
})

export function criarServidor(repositorio: RepositorioDePartidas, logger = false) {
  const app = Fastify({ logger })
  app.addHook('onClose', () => repositorio.fechar())

  app.get('/api/partida', (_, reply) => reply.header('Cache-Control', 'no-store').send(repositorio.buscar()))
  app.get<{ Params: { mes: string } }>('/api/partida/turnos/:mes', (request, reply) => {
    const mes = z.coerce.number().int().positive().safeParse(request.params.mes)
    if (!mes.success) return reply.code(400).send({ codigo: 'mesInvalido' })
    const partida = repositorio.buscarTurno(mes.data)
    if (!partida.estado) return reply.code(404).send({ codigo: 'turnoNaoEncontrado' })
    return reply.header('Cache-Control', 'no-store').send(partida)
  })
  app.post('/api/partida/turnos', (request, reply) => {
    const parsed = turnoSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ codigo: 'decisoesInvalidas' })
    const { geracao, mesAnterior, decisoes } = parsed.data
    try {
      return reply.send(repositorio.gravar(geracao, mesAnterior, decisoes))
    } catch (error) {
      if (error instanceof ConflitoDePartida) return reply.code(409).send({ codigo: error.message })
      if (error instanceof RangeError) return reply.code(400).send({ codigo: 'decisoesInvalidas' })
      throw error
    }
  })
  app.delete('/api/partida', (request, reply) => {
    const token = request.headers['if-match']
    const geracao = z.coerce.number().int().nonnegative().safeParse(token?.replace(/^"(\d+)"$/, '$1'))
    if (!token || !geracao.success) return reply.code(400).send({ codigo: 'geracaoInvalida' })
    try {
      const proximaGeracao = repositorio.apagar(geracao.data)
      return reply.header('X-GovGame-Geracao', proximaGeracao).code(204).send()
    } catch (error) {
      if (error instanceof ConflitoDePartida) return reply.code(409).send({ codigo: error.message })
      throw error
    }
  })
  return app
}
