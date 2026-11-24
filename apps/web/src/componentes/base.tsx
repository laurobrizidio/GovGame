import type { CSSProperties, ReactNode } from 'react'
import * as Slider from '@radix-ui/react-slider'
import { AlertTriangle, ArrowRight } from 'lucide-react'
import { coef, type Mensagem } from '@govgame/engine'
import { usarParametros } from '../store/partida'
import { num, pct, type Tom } from '../viewmodels/jogo'
import { t, traduzirMensagem } from '../viewmodels/textos'

export function Cartao({ titulo, detalhe, children, className = '' }: {
  titulo?: string; detalhe?: ReactNode; children: ReactNode; className?: string
}) {
  return <section className={`cartao ${className}`}>
    {titulo && <header className="cabecalho-cartao"><h2>{titulo}</h2>{detalhe}</header>}
    {children}
  </section>
}

export function Dados({ linhas }: {
  linhas: readonly { label: string; valor: ReactNode; tom?: Tom; total?: boolean }[]
}) {
  return <dl className="dados">
    {linhas.map(({ label, valor, tom, total }) =>
      <div key={label} className={total ? 'dado-total' : undefined}>
        <dt>{label}</dt><dd className={tom ? `tom-${tom}` : undefined}>{valor}</dd>
      </div>,
    )}
  </dl>
}

export function Aviso({ children, erro = false }: { children: ReactNode; erro?: boolean }) {
  return <div className={`aviso${erro ? ' aviso-erro' : ''}`} role={erro ? 'alert' : undefined}>
    <AlertTriangle size={16} aria-hidden="true" />
    <div>{children}</div>
  </div>
}

export function Manchete({ mensagem }: { mensagem: Mensagem }) {
  return <article className="manchete cartao">
    <p className="rotulo">{t('manchete')}</p>
    <strong>{traduzirMensagem(mensagem)}</strong>
  </article>
}

export function LinkBotao({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return <button type="button" className="link-botao" onClick={onClick}>
    {children} <ArrowRight size={15} aria-hidden="true" />
  </button>
}

export function Barra({ valor, maximo = 100, tom = 'positivo' }: { valor: number; maximo?: number; tom?: Tom }) {
  return <div className={`barra barra-${tom}`} aria-hidden="true">
    <span style={{ width: `${Math.min(100, Math.max(0, valor * 100 / maximo))}%` }} />
  </div>
}

export function BarraRisco({ valor }: { valor: number | null }) {
  const params = usarParametros()
  const criseInicio = coef(params, 'orcamento', 'riscoInicioCrise')
  const faixaRiscoAlta = coef(params, 'orcamento', 'riscoFaixaAlta')
  const faixaRiscoBaixa = coef(params, 'orcamento', 'riscoFaixaBaixa')
  const faixaRiscoMaxima = coef(params, 'orcamento', 'riscoMaximo')
  const escala = (marca: number) => `${marca * 100 / faixaRiscoMaxima}%`
  return <div className="faixas-risco" aria-hidden="true" style={{
    '--inicio-ambar': escala(faixaRiscoBaixa), '--inicio-vermelho': escala(faixaRiscoAlta),
  } as CSSProperties}>
    <div className="faixas-risco-trilho">
      {valor !== null && <span className="faixa-marcador" style={{ left: escala(valor) }} />}
    </div>
    <div className="faixas-risco-legenda">
      {[...new Set([0, faixaRiscoBaixa, faixaRiscoAlta, criseInicio])].map(marca =>
        <span key={marca} style={{ left: escala(marca) }}>
          {marca}{marca === criseInicio && <small>{t('crise')}</small>}
        </span>,
      )}
    </div>
  </div>
}

export function BarrasHistorico({ pontos, maximo, limiar, tom = 'positivo', percentual = false }: {
  pontos: { mes: number; valor: number | null }[]
  maximo?: number; limiar?: number; tom?: Tom; percentual?: boolean
}) {
  const disponiveis = pontos.filter((ponto): ponto is { mes: number; valor: number } => ponto.valor !== null)
  if (!disponiveis.length) return <div className="barras-vazias">{t('historicoVazio')}</div>
  const max = maximo ?? Math.max(1, ...disponiveis.map(ponto => ponto.valor))
  const min = Math.min(0, ...disponiveis.map(ponto => ponto.valor))
  const escala = (valor: number) => (valor - min) * 100 / (max - min)
  return <figure className={`barras-historico barras-${tom}`}>
    <div className="barras-grafico">
      {min < 0 && <span className="grafico-zero" style={{ bottom: `${escala(0)}%` }} />}
      {limiar !== undefined && <span className="grafico-limiar" style={{ bottom: `${escala(limiar)}%` }} />}
      {pontos.map(({ mes, valor }) => <span key={mes} className="grafico-coluna" aria-hidden="true">
        {valor !== null && <i
          className={limiar !== undefined && valor < limiar ? 'grafico-coluna-critica' : undefined}
          style={{ bottom: `${escala(Math.min(0, valor))}%`, height: `${Math.abs(escala(valor) - escala(0))}%` }}
          title={`${t('mes', { mes })} · ${percentual ? pct(valor) : num(valor)}`}
        />}
      </span>)}
    </div>
    <figcaption><span>{t('mes', { mes: pontos[0].mes })}</span><span>{t('mes', { mes: pontos.at(-1)?.mes ?? 0 })}</span></figcaption>
    <ul className="sr-only">
      {disponiveis.map(({ mes, valor }) => <li key={mes}>{t('mes', { mes })} · {percentual ? pct(valor) : num(valor)}</li>)}
    </ul>
  </figure>
}

export function SliderZonas({ label, valor, maximo, referencia, onChange, zonas, tom = 'neutro', projetado, formato, passo = 0.01 }: {
  label: string; valor: number; maximo: number; referencia?: number; onChange: (valor: number) => void;
  zonas?: string; tom?: Tom; projetado?: { valor: number; rotulo: string }; formato: (valor: number) => string; passo?: number
}) {
  return <Slider.Root
    className={`slider-zonas slider-${tom}`} max={maximo} step={passo}
    value={[valor]} onValueChange={([proximo]) => onChange(proximo)} disabled={maximo <= 0}
  >
    <Slider.Track className="slider-trilho" style={{ background: zonas }}>
      {!zonas && <Slider.Range className="slider-faixa" />}
      {referencia !== undefined && <span className="slider-marca" title={t('referencia2025')} style={{ left: `${referencia * 100 / maximo}%` }} />}
      {projetado && projetado.valor !== valor && <span className="slider-projetado" title={projetado.rotulo} style={{ left: `${projetado.valor * 100 / maximo}%` }} />}
    </Slider.Track>
    <Slider.Thumb className="slider-botao" aria-label={label} aria-valuetext={formato(valor)} />
  </Slider.Root>
}

export function SliderAliquota({ label, valor, referencia, projetada, tom, onChange }: {
  label: string; valor: number; referencia: number; projetada: number; tom: Tom; onChange: (valor: number) => void
}) {
  const params = usarParametros()
  const lafferLimiar = coef(params, 'ir', 'lafferLimiar')
  const irMaximo = coef(params, 'ir', 'aliquotaMaxima')
  const limiar = lafferLimiar * 100 / irMaximo
  const zonas = `linear-gradient(to right, var(--cor-cinza-trilho) ${limiar}%, transparent ${limiar}%), repeating-linear-gradient(135deg, var(--cor-ambar-medio) 0px 2px, var(--cor-ambar-faixa) 2px 5px)`
  return <div>
    <SliderZonas {...{ label, valor, referencia, onChange, zonas, tom }} maximo={irMaximo} formato={pct} passo={0.1}
      projetado={{ valor: projetada, rotulo: t('aliquotaProjetada') }}
    />
    <div className="slider-legenda" aria-hidden="true">
      <span>0%</span><span style={{ left: `${limiar}%` }}>{pct(lafferLimiar, 0)}</span><span>{pct(irMaximo, 0)}</span>
    </div>
  </div>
}
