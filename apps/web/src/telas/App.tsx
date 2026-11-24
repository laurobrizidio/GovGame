import { useEffect, useMemo, useRef } from 'react'
import { preview } from '@govgame/engine'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource/ibm-plex-sans/400.css'
import '@fontsource/ibm-plex-sans/500.css'
import '@fontsource/ibm-plex-sans/600.css'
import { Aviso } from '../componentes/base'
import { Hud, TopBar } from '../componentes/estrutura'
import { usarParametros, usarPartida } from '../store/partida'
import { t } from '../viewmodels/textos'
import { Gastos, Receitas } from './Decisoes'
import Calibracao from './Calibracao'
import { Economia, Povo, Tesouro } from './Leitura'
import Painel from './Painel'
import { Fechamento, FimDeJogo, Historico } from './Resultados'
import './governo.css'

export default function App() {
  const {
    estadoCommitado: estado, rascunhoDecisoes: decisoes, resultadoPendente, ultimoResultado,
    tela, abaAnterior, ocupado, carregado, erro, calibracao, carregar, navegar, ajustar, preparar, rever, confirmar, reiniciar,
  } = usarPartida()
  const bloco = useRef<HTMLElement>(null)
  const params = usarParametros()
  const previa = useMemo(() => preview(estado, decisoes, params), [estado, decisoes, params])

  useEffect(() => { void carregar() }, [carregar])
  useEffect(() => {
    if (carregado) {
      window.scrollTo(0, 0)
      bloco.current?.focus({ preventScroll: true })
    }
  }, [tela, carregado])

  if (!carregado) return <div className="estado-inicial">
    <header className="barra-topo barra-topo-simples"><strong>{t('marca')}</strong></header>
    <main>
      {erro ? <><Aviso erro>{t(erro)}</Aviso>
        <button className="botao botao-verde" type="button" disabled={ocupado} onClick={() => void carregar()}>{t('recarregar')}</button>
      </> : <p role="status">{t('carregando')}</p>}
    </main>
  </div>

  const encerrado = estado.fimDeJogo !== undefined
  const aba = tela === 'fechamento' || tela === 'historico' || tela === 'fim' ? abaAnterior : tela
  const bloqueado = tela === 'fechamento' || ocupado
  const edicaoProps = { estado, decisoes, previa, ajustar }
  return <>
    <a className="pular-conteudo" href="#conteudo">{t('pularConteudo')}</a>
    <header className="topo">
      {encerrado ? <div className="barra-topo barra-topo-simples"><strong>{t('marca')}</strong></div>
        : <>
          <TopBar estado={estado} previa={previa} aba={aba} bloqueado={bloqueado}
            fecharBloqueado={bloqueado || tela === 'historico' || tela === 'calibracao'}
            calibracao={calibracao !== null} navegar={navegar} preparar={preparar}
          />
          <Hud estado={estado} resultado={ultimoResultado} bloqueado={bloqueado} navegar={navegar} />
        </>}
    </header>
    <main id="conteudo" className="conteudo" tabIndex={-1} ref={bloco}>
      {erro && <div className="erro-global"><Aviso erro>{t(erro)}</Aviso></div>}
      {tela === 'painel' && <Painel estado={estado} previa={previa} resultado={ultimoResultado} navegar={navegar} abrirHistorico={() => navegar('historico')} />}
      {tela === 'gastos' && <Gastos {...edicaoProps} />}
      {tela === 'receitas' && <Receitas {...edicaoProps} />}
      {tela === 'tesouro' && <Tesouro {...edicaoProps} />}
      {tela === 'economia' && <Economia estado={estado} resultado={ultimoResultado} />}
      {tela === 'povo' && <Povo estado={estado} />}
      {tela === 'calibracao' && calibracao && <Calibracao parametros={params} />}
      {tela === 'fechamento' && resultadoPendente &&
        <Fechamento anterior={estado} resultado={resultadoPendente} ocupado={ocupado} rever={rever} confirmar={() => void confirmar()} />}
      {tela === 'fim' && <FimDeJogo estado={estado} ocupado={ocupado} reiniciar={reiniciar} abrirHistorico={() => navegar('historico')} />}
      {tela === 'historico' && <Historico estado={estado} voltar={() => navegar(encerrado ? 'fim' : 'painel')} />}
    </main>
  </>
}
