import { CalendarDays, Minus } from 'lucide-react'
import {
  agenda, CLASSES, MINISTERIOS, coef, parametros2025 as params,
  type GameState, type PreviewFiscal, type ResultadoDoMes,
} from '@govgame/engine'
import { Barra, BarraRisco, BarrasHistorico, Cartao, LinkBotao, Manchete } from '../componentes/base'
import { limiarImpeachment, num, pct, pp, pressaoTeto, sinal, valoresFluxo, type Aba } from '../viewmodels/jogo'
import { t, textos, textoSegmento, traduzirMensagem } from '../viewmodels/textos'

export default function Painel({ estado, previa, resultado, navegar, abrirHistorico }: {
  estado: GameState; previa: PreviewFiscal; resultado: ResultadoDoMes | null;
  navegar: (aba: Aba) => void; abrirHistorico: () => void
}) {
  const { social, fiscal, historico } = estado
  const aprovacao = social.aprovacaoGeral
  const agendaDoMandato = agenda(estado, params)
  const fluxo = valoresFluxo(previa)
  const maximo = Math.max(1, ...fluxo.map(item => Math.abs(item.valor)))
  const maximoServico = coef(params, 'orcamento', 'notaServicoInicial')
  const servicosComprometidos = MINISTERIOS.filter(id => fiscal.servicos[id].nota < maximoServico)
  const manchetes = resultado?.manchetes.filter(mensagem => !mensagem.codigo.startsWith('pressao.')) ?? []
  const pressoes = social.pressoesExibidas
  const delta = resultado?.deltas.aprovacao

  return <div className="painel-grid">
    <div className="coluna">
      <section className="aprovacao-heroi" aria-label={t('aprovaçãoGeral')}>
        <div className="heroi-cabecalho">
          <div>
            <p className="rotulo">{t('aprovaçãoGeral')}</p>
            <h1>{pct(aprovacao, 0)}</h1>
          </div>
          <div className="heroi-condicao">
            {delta !== null && delta !== undefined && <strong>{t('noMes', { valor: pp(delta, 1, true) })}</strong>}
            <p>{t('impeachmentNota', { limiar: pct(limiarImpeachment, 0), meses: coef(params, 'turno', 'mesesImpeachment') })}</p>
          </div>
        </div>
        <div className="heroi-graficos">
          <div>
            <h2 className="rotulo">{t('porClasse')}</h2>
            <div className="barras-classes">
              {CLASSES.map(classe => {
                const valor = social.aprovacaoPorClasse?.[classe] ?? null
                return <div key={classe}>
                  <span aria-hidden="true" className="barra-classe">
                    <i data-disponivel={valor !== null} style={{ height: `${valor ?? 8}%` }} />
                  </span>
                  <strong>{pct(valor, 0)}</strong>
                  <small aria-label={t('classe', { classe })}>{classe}</small>
                </div>
              })}
            </div>
          </div>
          <div>
            <h2 className="rotulo">{t('historico')}</h2>
            {aprovacao === null
              ? <div className="heroi-vazio"><Minus size={22} aria-hidden="true" /><span>{t('aprovacaoPendente')}</span></div>
              : <BarrasHistorico pontos={historico.filter(item => item.mes > 0).map(item => ({ mes: item.mes, valor: item.social.aprovacaoGeral }))}
                maximo={100} limiar={limiarImpeachment} percentual
              />}
          </div>
        </div>
        <div className="heroi-rodape">
          <p>{t('aprovacaoNota')}</p>
          {estado.mes > 0 && <LinkBotao onClick={abrirHistorico}>{t('reverHistorico')}</LinkBotao>}
        </div>
      </section>
      <Cartao titulo={t('proximosMeses')} detalhe={<CalendarDays className="texto-suave" size={18} aria-hidden="true" />}>
        {agendaDoMandato.length
          ? <ul className="lista-agenda">
            {agendaDoMandato.map(({ mes, mensagem }, i) =>
              <li key={`${mes}-${i}`}><strong>{t('mes', { mes })}</strong><span>{traduzirMensagem(mensagem)}</span></li>,
            )}
          </ul>
          : <p className="texto-suave">{t('agendaVazia')}</p>}
      </Cartao>
    </div>
    <div className="coluna">
      <Cartao titulo={t('fluxo')} detalhe={<span className="texto-suave detalhe-cartao">{t('fluxoUnidade')}</span>}>
        <dl className="fluxo">
          {fluxo.map(item =>
            <div key={item.label}>
              <dt className={'total' in item ? 'fluxo-total' : undefined}>{item.label}</dt>
              <Barra valor={Math.abs(item.valor)} maximo={maximo} tom={item.tom} />
              <dd>{sinal(item.valor)}</dd>
            </div>,
          )}
        </dl>
        <p className="rodape-cartao">{t('fluxoNota')}</p>
        {previa.fluxo.estimado && <p className="nota-parcial">{t('fluxoEstimado')}</p>}
      </Cartao>
      <Cartao titulo={t('risco')} detalhe={<LinkBotao onClick={() => navegar('tesouro')}>{t('abrirTesouro')}</LinkBotao>}>
        <div className="destaque-numero">
          <strong>{num(fiscal.riscoFiscal, 0)}</strong>
          <span className="texto-suave">{fiscal.premioRiscoAa === null
            ? t('riscoPendente') : t('premio', { valor: pp(fiscal.premioRiscoAa, 2, true) })}
          </span>
        </div>
        <BarraRisco valor={fiscal.riscoFiscal} />
      </Cartao>
    </div>
    <div className="coluna">
      <section className="pauta">
        <header className="cabecalho-cartao">
          <h2>{t('pauta')}</h2>
          <span className="texto-suave detalhe-cartao">{t('pressoesTeto', { ativas: pressoes.length, teto: pressaoTeto })}</span>
        </header>
        {manchetes.length + pressoes.length === 0 && <Cartao className="pauta-vazia"><p className="texto-suave">{t('nenhumaPauta')}</p></Cartao>}
        {manchetes.map((mensagem, i) => <Manchete key={`${mensagem.codigo}-${i}`} mensagem={mensagem} />)}
        {pressoes.map(id => {
          const segmento = textoSegmento(id)
          return segmento && <article key={id} className="cartao pauta-pressao">
            <p className="rotulo">{t('pressao', { segmento: segmento[0] })}</p>
            <p>{segmento[1]}</p>
          </article>
        })}
      </section>
      <Cartao titulo={t('qualidade')} detalhe={<strong className="qualidade-nota">{num(fiscal.qualidadeServicos, 0)} <small>/ {maximoServico}</small></strong>}>
        {servicosComprometidos.length
          ? <ul className="lista-servicos">{servicosComprometidos.map(id => {
            const servico = fiscal.servicos[id]
            return <li key={id}><span><strong>{textos.ministerios[id]}</strong>
              {servico.abaixoPiso && <> · {t('abaixoPiso', { meses: servico.mesesAbaixoPiso })}</>}
            </span><b>{t('notaServico', { nota: num(servico.nota, 0) })}</b></li>
          })}</ul>
          : <p className="texto-suave">{t('servicosEstaveis')}</p>}
      </Cartao>
    </div>
  </div>
}
