import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { GameState, RegistroMes, ResultadoDoMes } from '@govgame/engine'
import { Aviso, BarrasHistorico, Cartao, Manchete } from '../componentes/base'
import { compararKpis, duracaoMandato, limiarImpeachment, num, pct, resumoMotor } from '../viewmodels/jogo'
import { t, textos, traduzirMensagem } from '../viewmodels/textos'

export function RelatorioMes({ anterior, resultado }: { anterior: RegistroMes; resultado: ResultadoDoMes }) {
  const futuro = resultado.proximoEstado
  const avisos = resultado.avisos
  const colunaFinal = futuro.fimDeJogo ? t('resultadoMes', { mes: futuro.mes }) : t('mes', { mes: futuro.mes + 1 })
  return <div className="fechamento-grid">
    <Cartao titulo={t('ordem')}>
      <ol className="ordem-motores">
        {resultado.trace.map((etapa, i) => {
          const [nome, nota] = textos.motores[etapa.motor]
          return <li key={etapa.motor}>
            <span className="numero-motor" aria-hidden="true">{i + 1}</span>
            <div><header><h3>{nome}</h3><small>{nota}</small></header><p>{resumoMotor(etapa)}</p></div>
          </li>
        })}
      </ol>
      {futuro.fluxo.estimado && <p className="nota-parcial">{t('fluxoEstimado')}</p>}
    </Cartao>
    <div className="coluna">
      <Cartao titulo={t('mudancas')}>
        <table className="tabela-comparacao">
          <thead><tr><td /><th scope="col">{t('mes', { mes: anterior.mes + 1 })}</th><td /><th scope="col">{colunaFinal}</th></tr></thead>
          <tbody>{compararKpis(anterior, futuro).map(item => <tr key={item.id}>
            <th scope="row">{item.label}</th><td>{item.anterior}</td>
            <td><ArrowRight aria-hidden="true" size={15} /></td>
            <td className={`tom-${item.tom}`}>{item.proximo}</td>
          </tr>)}</tbody>
        </table>
      </Cartao>
      <Cartao titulo={t('manchetesAvisos')}>
        <div className="lista-avisos">
          {resultado.manchetes.map((mensagem, i) => <Manchete key={`${mensagem.codigo}-${i}`} mensagem={mensagem} />)}
          {avisos.map((mensagem, i) => <Aviso key={`${mensagem.codigo}-${i}`}>{traduzirMensagem(mensagem)}</Aviso>)}
          {avisos.length + resultado.manchetes.length === 0 && <p className="texto-suave">{t('semAvisos')}</p>}
        </div>
      </Cartao>
    </div>
  </div>
}

export function Fechamento({ anterior, resultado, ocupado, rever, confirmar }: {
  anterior: GameState; resultado: ResultadoDoMes; ocupado: boolean; rever: () => void; confirmar: () => void;
}) {
  const mes = resultado.proximoEstado.mes
  const final = resultado.proximoEstado.fimDeJogo
  return <div className="coluna">
    <header className="fechamento-cabecalho">
      <div className="titulo-pagina"><p className="rotulo">{t('resultadoMes', { mes })}</p><h1>{t('fechamentoTitulo')}</h1></div>
      <div className="acoes">
        <button className="botao botao-secundario" type="button" disabled={ocupado} onClick={rever}>{t('rever')}</button>
        <button className="botao botao-verde" type="button" disabled={ocupado} onClick={confirmar}>
          {ocupado ? t('salvando') : final ? t('confirmarFinal') : t('proximoMes', { mes: mes + 1 })}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
    <RelatorioMes anterior={anterior} resultado={resultado} />
  </div>
}

export function FimDeJogo({ estado, ocupado, reiniciar, abrirHistorico }: {
  estado: GameState; ocupado: boolean; reiniciar: () => Promise<void>; abrirHistorico: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false)
  const fim = estado.fimDeJogo
  if (!fim) return null

  return <div className="fim-grid">
    <div className="coluna">
      <section className={`fim-heroi${fim.tipo === 'mandato' ? ' fim-normal' : ''}`}>
        <p className="rotulo">{t('fimMes', { mes: estado.mes, total: duracaoMandato })}</p>
        <h1>{textos.finais[fim.tipo][0]}</h1><p>{textos.finais[fim.tipo][1]}</p>
        <div className="acoes">
          {confirmando
            ? <>
              <p className="confirma-novo">{t('confirmaNovoTexto')}</p>
              <button type="button" className="botao botao-claro" disabled={ocupado} onClick={() => void reiniciar()}>{t('confirmarNovo')}</button>
              <button type="button" className="botao botao-contorno" disabled={ocupado} onClick={() => setConfirmando(false)}>{t('cancelar')}</button>
            </>
            : <>
              <button type="button" className="botao botao-claro" onClick={() => setConfirmando(true)}>{t('novoJogo')}</button>
              <button type="button" className="botao botao-contorno" onClick={abrirHistorico}>{t('reverHistorico')}</button>
            </>}
        </div>
      </section>
      <Cartao titulo={t('historicoAprovacao')} detalhe={<span className="texto-suave">{t('limiarNota', { valor: pct(limiarImpeachment, 0) })}</span>}>
        {estado.social.aprovacaoGeral === null
          ? <Aviso>{t('aprovacaoPendente')}</Aviso>
          : <BarrasHistorico pontos={estado.historico.filter(item => item.mes > 0).map(item => ({ mes: item.mes, valor: item.social.aprovacaoGeral }))}
            maximo={100} limiar={limiarImpeachment} percentual
          />}
      </Cartao>
      <div className="fim-estatisticas">
        {([
          [textos.kpis.dividaPib, pct(estado.fiscal.dividaPibPct)],
          [textos.kpis.ipca, pct(estado.macro.ipca12mPct)],
          [textos.kpis.desemprego, pct(estado.social.desempregoPct)],
          [textos.kpis.riscoFiscal, num(estado.fiscal.riscoFiscal, 0)],
        ] as const).map(([label, valor]) => <Cartao key={label}>
          <p className="rotulo">{label}</p><strong className="numero-grande compacto">{valor}</strong>
        </Cartao>)}
      </div>
      <Cartao titulo={t('pontuacao')}>
        {fim.pontuacao === null ? <Aviso>{t('pontuacaoPendente')}</Aviso>
          : <strong className="numero-grande">{t('deCem', { valor: num(fim.pontuacao) })}</strong>}
      </Cartao>
    </div>
    <div className="coluna finais-lista">
      <h2>{t('todosFinais')}</h2>
      {Object.entries(textos.finais).map(([tipo, [titulo, descricao]]) =>
        <Cartao key={tipo} titulo={titulo} className={tipo === fim.tipo ? 'final-atual' : undefined}
          detalhe={tipo === fim.tipo ? <span className="etiqueta">{t('esteFinal')}</span> : undefined}>
          <p className="texto-suave">{descricao}</p>
        </Cartao>,
      )}
    </div>
  </div>
}

export function Historico({ estado, voltar }: { estado: GameState; voltar: () => void }) {
  const [mes, setMes] = useState(estado.mes)
  const [retorno, setRetorno] = useState<{ mes: number; resultado: ResultadoDoMes | null } | null>(null)
  const anterior = estado.historico.find(registro => registro.mes === mes - 1)

  useEffect(() => {
    if (mes <= 0) return
    const controle = new AbortController()
    async function consultar() {
      try {
        const resposta = await fetch(`/api/partida/turnos/${mes}`, { signal: controle.signal })
        if (!resposta.ok) throw new Error(String(resposta.status))
        const dados = await resposta.json() as { resultado?: ResultadoDoMes }
        if (!controle.signal.aborted) setRetorno({ mes, resultado: dados.resultado ?? null })
      } catch {
        if (!controle.signal.aborted) setRetorno({ mes, resultado: null })
      }
    }
    void consultar()
    return () => controle.abort()
  }, [mes])

  const atual = retorno?.mes === mes ? retorno : null
  return <div className="coluna">
    <header className="fechamento-cabecalho">
      <div className="titulo-pagina"><h1>{t('historicoMandato')}</h1></div>
      <div className="acoes">
        {estado.mes > 0 && <label className="historico-seletor">
          <span>{t('historicoAbertura')}</span>
          <select value={mes} onChange={evento => setMes(Number(evento.target.value))}>
            {estado.historico.filter(registro => registro.mes > 0).map(registro =>
              <option key={registro.mes} value={registro.mes}>{t('mes', { mes: registro.mes })}</option>,
            )}
          </select>
        </label>}
        <button className="botao botao-secundario" type="button" onClick={voltar}><ArrowLeft size={16} aria-hidden="true" />{t('voltar')}</button>
      </div>
    </header>
    {mes <= 0 ? <p className="texto-suave">{t('historicoVazio')}</p>
      : atual === null ? <p role="status">{t('carregando')}</p>
      : atual.resultado && anterior ? <RelatorioMes anterior={anterior} resultado={atual.resultado} />
      : <Aviso erro>{t('historicoErro')}</Aviso>}
  </div>
}
