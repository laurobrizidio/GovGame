import Fastify from 'fastify'
import { z } from 'zod'
import { decisoesSchema } from '@govgame/engine'
import { ConflitoDePartida, type RepositorioDePartidas } from './repositorio'
import type { Calibracao } from './calibracao'

const turnoSchema = z.strictObject({
  geracao: z.number().int().nonnegative(),
  mesAnterior: z.number().int().nonnegative(),
  decisoes: decisoesSchema,
  versaoParametros: z.string().optional(),
})

const calibracaoSchema = z.strictObject({
  geracao: z.number().int().nonnegative(),
  mesAnterior: z.number().int().nonnegative(),
  versaoParametros: z.string(),
  decisoes: decisoesSchema,
  alteracoes: z.array(z.strictObject({ motor: z.string(), chave: z.string(), valor: z.number().nullable() })).min(1),
})

export function criarServidor(repositorio: RepositorioDePartidas, logger = false, calibracao?: Calibracao) {
  const app = Fastify({ logger })
  app.addHook('onClose', () => repositorio.fechar())

  function partidaAtual() {
    const partida = repositorio.buscar()
    return calibracao ? { ...partida, calibracao: calibracao.descrever() } : partida
  }

  app.get('/api/partida', (_, reply) => reply.header('Cache-Control', 'no-store').send(partidaAtual()))
  if (calibracao) app.put('/api/calibracao', (request, reply) => {
    const parsed = calibracaoSchema.safeParse(request.body)
    if (!parsed.success) return reply.code(400).send({ codigo: 'calibracaoInvalida' })
    const { geracao, mesAnterior, versaoParametros, decisoes, alteracoes } = parsed.data
    const partida = repositorio.buscar()
    if (geracao !== partida.geracao || mesAnterior !== (partida.estado?.mes ?? 0)
      || versaoParametros !== calibracao.parametros().versao) {
      return reply.code(409).send({ codigo: 'partidaAlterada' })
    }
    try {
      calibracao.aplicar(alteracoes, partida.estado, decisoes)
      return reply.send(partidaAtual())
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ codigo: 'calibracaoInvalida', detalhes: error.issues.map(item => item.message) })
      }
      if (error instanceof RangeError) return reply.code(400).send({ codigo: 'calibracaoInvalida', detalhes: [error.message] })
      throw error
    }
  })
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
    const { geracao, mesAnterior, decisoes, versaoParametros } = parsed.data
    if (calibracao && versaoParametros !== calibracao.parametros().versao) {
      return reply.code(409).send({ codigo: 'versaoIncompativel' })
    }
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
    if (calibracao && request.headers['x-govgame-versao-parametros'] !== calibracao.parametros().versao) {
      return reply.code(409).send({ codigo: 'versaoIncompativel' })
    }
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
