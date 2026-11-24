import { create } from 'zustand'
import {
  criarEstadoInicial, fecharMes, parametros2025 as params,
  type Decisoes, type GameState, type ResultadoDoMes,
} from '@govgame/engine'
import type { Aba } from '../viewmodels/jogo'

type Resposta = { geracao: number; estado: GameState | null; resultado?: ResultadoDoMes }
type Erro = 'erroCarregar' | 'erroSalvar' | 'erroConflito' | 'erroReiniciar'
type Tela = Aba | 'fechamento' | 'fim' | 'historico'
type Partida = {
  estadoCommitado: GameState
  rascunhoDecisoes: Decisoes
  resultadoPendente: ResultadoDoMes | null
  ultimoResultado: ResultadoDoMes | null
  tela: Tela
  abaAnterior: Aba
  geracao: number
  carregado: boolean
  ocupado: boolean
  erro: Erro | null
  carregar: () => Promise<void>
  navegar: (tela: Aba | 'fim' | 'historico') => void
  ajustar: (alterar: (decisoes: Decisoes) => Decisoes) => void
  preparar: () => void
  rever: () => void
  confirmar: () => Promise<void>
  reiniciar: () => Promise<void>
}

const estadoInicial = criarEstadoInicial(params)

export const usarPartida = create<Partida>((set, get) => ({
  estadoCommitado: estadoInicial,
  rascunhoDecisoes: estadoInicial.decisoes,
  resultadoPendente: null,
  ultimoResultado: null,
  tela: 'painel',
  abaAnterior: 'painel',
  geracao: 0,
  carregado: false,
  ocupado: false,
  erro: null,
  carregar: async () => {
    if (get().ocupado || get().carregado) return
    set({ ocupado: true, erro: null })
    try {
      const resposta = await fetch('/api/partida')
      if (!resposta.ok) throw new Error(String(resposta.status))
      const { estado, resultado, geracao } = await resposta.json() as Resposta
      const atual = estado ?? estadoInicial
      set({
        estadoCommitado: atual, rascunhoDecisoes: atual.decisoes, ultimoResultado: resultado ?? null,
        tela: atual.fimDeJogo ? 'fim' : 'painel', carregado: true, geracao,
      })
    } catch {
      set({ erro: 'erroCarregar' })
    } finally {
      set({ ocupado: false })
    }
  },
  navegar: tela => {
    if (!get().resultadoPendente) set({ tela })
  },
  ajustar: alterar => {
    const partida = get()
    if (partida.resultadoPendente || partida.estadoCommitado.fimDeJogo || partida.ocupado) return
    set({ rascunhoDecisoes: alterar(partida.rascunhoDecisoes) })
  },
  preparar: () => {
    const { estadoCommitado, rascunhoDecisoes, tela, resultadoPendente, ocupado } = get()
    if (tela === 'historico' || tela === 'fim' || tela === 'fechamento' || estadoCommitado.fimDeJogo || resultadoPendente || ocupado) return
    set({
      resultadoPendente: fecharMes(estadoCommitado, rascunhoDecisoes, params),
      abaAnterior: tela, tela: 'fechamento', erro: null,
    })
  },
  rever: () => {
    if (!get().ocupado) set({ resultadoPendente: null, tela: get().abaAnterior, erro: null })
  },
  confirmar: async () => {
    const partida = get()
    if (partida.ocupado || !partida.resultadoPendente) return
    set({ ocupado: true, erro: null })
    try {
      const resposta = await fetch('/api/partida/turnos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geracao: partida.geracao, mesAnterior: partida.estadoCommitado.mes, decisoes: partida.rascunhoDecisoes }),
      })
      if (resposta.status === 409) {
        set({ erro: 'erroConflito' })
        return
      }
      if (!resposta.ok) throw new Error(String(resposta.status))
      const { estado, resultado, geracao } = await resposta.json() as Resposta
      if (!estado) throw new Error('Missing state')
      set({
        estadoCommitado: estado, rascunhoDecisoes: estado.decisoes,
        resultadoPendente: null, ultimoResultado: resultado ?? partida.resultadoPendente,
        tela: estado.fimDeJogo ? 'fim' : 'painel', geracao,
      })
    } catch {
      set({ erro: 'erroSalvar' })
    } finally {
      set({ ocupado: false })
    }
  },
  reiniciar: async () => {
    const partida = get()
    if (partida.ocupado) return
    set({ ocupado: true, erro: null })
    try {
      const resposta = await fetch('/api/partida', { method: 'DELETE', headers: { 'If-Match': String(partida.geracao) } })
      if (resposta.status === 409) {
        set({ erro: 'erroConflito' })
        return
      }
      if (!resposta.ok) throw new Error(String(resposta.status))
      const token = resposta.headers.get('X-GovGame-Geracao')
      if (!token || !Number.isInteger(Number(token))) throw new Error('Invalid generation')
      set({
        estadoCommitado: estadoInicial, rascunhoDecisoes: estadoInicial.decisoes,
        resultadoPendente: null, ultimoResultado: null, tela: 'painel', abaAnterior: 'painel', geracao: Number(token),
      })
    } catch {
      set({ erro: 'erroReiniciar' })
    } finally {
      set({ ocupado: false })
    }
  },
}))
