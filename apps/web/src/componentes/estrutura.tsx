import { ArrowDown, ArrowRight, ArrowUp, BarChart3, ChartNoAxesCombined, Landmark, LayoutDashboard, ReceiptText, UsersRound } from 'lucide-react'
import type { GameState, PreviewFiscal, ResultadoDoMes } from '@govgame/engine'
import {
  abas, anosMandato, biAssinado, deltaHud, duracaoMandato, kpis, mesesAno, type Aba,
} from '../viewmodels/jogo'
import { t, textos } from '../viewmodels/textos'

const icones = {
  painel: LayoutDashboard, gastos: BarChart3, receitas: ReceiptText,
  tesouro: Landmark, economia: ChartNoAxesCombined, povo: UsersRound,
}

export function TopBar({ estado, previa, aba, bloqueado, fecharBloqueado, navegar, preparar }: {
  estado: GameState; previa: PreviewFiscal; aba: Aba; bloqueado: boolean; fecharBloqueado: boolean;
  navegar: (aba: Aba) => void; preparar: () => void
}) {
  const mes = Math.min(estado.mes + 1, duracaoMandato)
  const ano = Math.ceil(mes / mesesAno)
  return <div className="barra-topo">
    <button type="button" className="marca" disabled={bloqueado} onClick={() => navegar('painel')}>
      <strong>{t('marca')}</strong><small>{t('assinatura')}</small>
    </button>
    <nav aria-label={t('navegacao')} className="abas">
      {abas.map(id => {
        const Icone = icones[id]
        return <button key={id} type="button" aria-current={aba === id ? 'page' : undefined}
          disabled={bloqueado} onClick={() => navegar(id)}
        ><Icone size={15} aria-hidden="true" />{textos.abas[id]}</button>
      })}
    </nav>
    <div className="mandato">
      <span><strong>{t('mesDe', { mes, total: duracaoMandato })}</strong>{t('anoDe', { ano, total: anosMandato })}</span>
      <div className="mandato-barras" aria-hidden="true">
        {Array.from({ length: anosMandato }, (_, index) =>
          <i key={index} data-atual={index + 1 <= ano} />,
        )}
      </div>
    </div>
    <div className="projecao-topo" aria-live="polite">
      <span>{t(previa.fluxo.estimado ? 'projecaoEstimada' : 'projecao')}</span>
      <strong className={previa.fluxo.resultadoNominalBi < 0 ? 'saldo-topo' : undefined}>
        {t('nominalCurto', { valor: biAssinado(previa.fluxo.resultadoNominalBi) })}
      </strong>
    </div>
    <button className="botao botao-ambar" type="button" disabled={fecharBloqueado} onClick={preparar}>
      {t('fecharMes')}<ArrowRight size={18} aria-hidden="true" />
    </button>
  </div>
}

export function Hud({ estado, resultado, bloqueado, navegar }: {
  estado: GameState; resultado: ResultadoDoMes | null; bloqueado: boolean; navegar: (aba: Aba) => void
}) {
  return <nav className="hud" aria-label={t('indicadores')}>
    {kpis(estado).map(kpi => {
      const delta = deltaHud(resultado, kpi.id)
      const Variacao = delta?.sobe ? ArrowUp : ArrowDown
      return <button key={kpi.id} type="button" className="hud-item" disabled={bloqueado} onClick={() => navegar(kpi.aba)}>
        <span className="rotulo">{textos.kpis[kpi.id]}</span>
        <strong>{kpi.exibir(kpi.valor)}</strong>
        <span className={delta ? `tom-${delta.tom}` : undefined}>
          {delta && <Variacao size={13} aria-hidden="true" />}
          {delta?.texto ?? kpi.detalhe}
        </span>
      </button>
    })}
  </nav>
}
