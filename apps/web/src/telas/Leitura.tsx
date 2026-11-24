import { useMemo } from 'react'
import {
  CLASSES, coef, projetar,
  type Decisoes, type GameState, type PreviewFiscal, type ResultadoDoMes, type Segmento,
} from '@govgame/engine'
import { Aviso, Barra, BarraRisco, BarrasHistorico, Cartao, Dados, SliderZonas } from '../componentes/base'
import { usarParametros } from '../store/partida'
import { bilhoes, cotacao, mesesAno, num, pct, pp, sinal, trilhoes, usdBi } from '../viewmodels/jogo'
import { nomeImpulso, t, textos, textoSegmento } from '../viewmodels/textos'

export function Tesouro({ estado, decisoes, previa, ajustar }: {
  estado: GameState; decisoes: Decisoes; previa: PreviewFiscal; ajustar: (alterar: (decisoes: Decisoes) => Decisoes) => void
}) {
  const params = usarParametros()
  const { fiscal } = estado
  const previsao = useMemo(() => projetar(estado, decisoes, mesesAno, params), [estado, decisoes, params])
  const caixaMinimo = coef(params, 'orcamento', 'caixaMinimoBi')
  const criseInicio = coef(params, 'orcamento', 'riscoInicioCrise')
  const criseFim = coef(params, 'orcamento', 'riscoFimCrise')
  const faixaRiscoAlta = coef(params, 'orcamento', 'riscoFaixaAlta')
  const faixaRiscoBaixa = coef(params, 'orcamento', 'riscoFaixaBaixa')
  const faixaRiscoMaxima = coef(params, 'orcamento', 'riscoMaximo')
  const pontos = [
    { mes: estado.mes, valor: fiscal.dividaPibPct },
    ...previsao.meses.map(({ proximoEstado }) => ({ mes: proximoEstado.mes, valor: proximoEstado.fiscal.dividaPibPct })),
  ]
  const margem = Math.min(fiscal.dividaBi, Math.max(0, fiscal.caixaBi - caixaMinimo))
  const selicMediaAa = estado.series.selicAa.reduce((total, valor) => total + valor, 0) / estado.series.selicAa.length
  const premioFaixaAlta = coef(params, 'orcamento', 'premioFaixaAlta')
  const premioMaximo = coef(params, 'orcamento', 'premioMaximo')
  const disponivel = fiscal.criseRolagem === null ? t('pendente') : fiscal.criseRolagem ? t('ativa') : t('inativa')
  return <div className="tesouro-grid">
    <div className="coluna">
      <Cartao titulo={t('risco')} detalhe={<strong className="numero-grande compacto">{num(fiscal.riscoFiscal, 0)}</strong>}>
        <p className="texto-suave">{t('riscoDef')}</p>
        <BarraRisco valor={fiscal.riscoFiscal} />
        <h3 className="rotulo rotulo-secao">{t('origemIndice')}</h3>
        <Dados linhas={[
          { label: t('primarioAjustado'), valor: t('peso', { valor: pct(coef(params, 'orcamento', 'pesoPrimario') * 100, 0) }) },
          { label: textos.kpis.dividaPib, valor: t('peso', { valor: pct(coef(params, 'orcamento', 'pesoDivida') * 100, 0) }) },
          { label: t('juros'), valor: t('peso', { valor: pct(coef(params, 'orcamento', 'pesoJuros') * 100, 0) }) },
        ]} />
        {fiscal.riscoFiscal === null && <Aviso>{t('riscoPendente')}</Aviso>}
      </Cartao>
      <Cartao titulo={t('premioJuros')}>
        <p className="texto-suave">{t('premioNota')}</p>
        <Dados linhas={[
          { label: t('riscoFaixa', { min: 0, max: faixaRiscoBaixa }), valor: pp(0, 0) },
          { label: t('riscoFaixa', { min: faixaRiscoBaixa, max: faixaRiscoAlta }), valor: t('faixaPremio', { min: 0, max: pp(premioFaixaAlta, 0) }) },
          { label: t('riscoFaixa', { min: faixaRiscoAlta, max: faixaRiscoMaxima }), valor: t('faixaPremio', { min: premioFaixaAlta, max: pp(premioMaximo, 0) }) },
        ]} />
      </Cartao>
    </div>
    <div className="coluna">
      <Cartao titulo={t('divida')}>
        <div className="par-numeros"><strong className="numero-grande">{trilhoes(fiscal.dividaBi)}</strong><strong>{pct(fiscal.dividaPibPct)} · {textos.kpis.dividaPib}</strong></div>
        <h3 className="rotulo rotulo-secao">{t('projecaoDivida')}</h3>
        <BarrasHistorico pontos={pontos} tom="negativo" percentual />
        {previa.fluxo.estimado && <p className="nota-parcial">{t('projecaoDividaParcial')}</p>}
      </Cartao>
      <Cartao titulo={t('faturaJuros')}>
        <strong className="numero-grande">{bilhoes(previa.fluxo.jurosBi)}</strong>
        <Dados linhas={[
          { label: t('mediaSelic', { meses: estado.series.selicAa.length }), valor: pct(selicMediaAa, 2) },
          { label: t('premioAnterior'), valor: fiscal.premioRiscoAa === null ? t('pendente') : pp(fiscal.premioRiscoAa, 2, true) },
        ]} />
      </Cartao>
    </div>
    <div className="coluna">
      <Cartao className="caixa-heroi">
        <p className="rotulo">{t('caixa')}</p>
        <strong className="numero-grande">{trilhoes(fiscal.caixaBi)}</strong>
        <div className="caixa-trilho">
          <Barra valor={fiscal.caixaBi} maximo={Math.max(caixaMinimo, fiscal.caixaBi) * 1.2} />
          <span aria-hidden="true" style={{ left: `${caixaMinimo * 100 / (Math.max(caixaMinimo, fiscal.caixaBi) * 1.2)}%` }} />
        </div>
        <p className="caixa-minimo">{t('minimo', { valor: trilhoes(caixaMinimo) })}</p>
        <p className="rodape-cartao">{t('caixaNota')}</p>
      </Cartao>
      <Cartao titulo={t('amortizacao')}>
        <p className="texto-suave">{t('amortizacaoNota')}</p>
        <Dados linhas={[{ label: t('amortizacaoLimite'), valor: bilhoes(margem) }]} />
        {margem > 0 && <SliderZonas label={t('amortizacaoEscolha')} valor={decisoes.amortizacaoBi}
          maximo={margem} formato={bilhoes} passo={1} tom="positivo"
          onChange={amortizacaoBi => ajustar(atual => ({ ...atual, amortizacaoBi }))}
        />}
        <Dados linhas={[{ label: t('amortizacaoEscolha'), valor: bilhoes(decisoes.amortizacaoBi) }]} />
        {decisoes.amortizacaoBi > 0 && <button type="button" className="botao botao-secundario largura-total"
          onClick={() => ajustar(atual => ({ ...atual, amortizacaoBi: 0 }))}>
          {t('amortizacaoZerar')}
        </button>}
      </Cartao>
      <Cartao titulo={t('crise')} detalhe={<span className={`etiqueta ${fiscal.criseRolagem === true ? 'etiqueta-critica' : ''}`}>{disponivel}</span>}>
        <p className="texto-suave">{t('criseNota', { inicio: criseInicio, fim: criseFim })}</p>
      </Cartao>
    </div>
  </div>
}

export function Economia({ estado, resultado }: { estado: GameState; resultado: ResultadoDoMes | null }) {
  const params = usarParametros()
  const { macro, bc } = estado
  const selicNeutraAa = coef(params, 'bc', 'selicNeutraAa')
  const statusMonetario = bc.selicAa > selicNeutraAa ? t('apertoMonetario')
    : bc.selicAa < selicNeutraAa ? t('afrouxamentoMonetario') : t('neutra')
  const impulsosMacro = resultado?.trace.find(item => item.motor === 'macro')?.impulsos ?? []
  const impulsos = impulsosMacro.filter(item => item.fonte.startsWith('pib'))
  const consumoNoIpca = impulsosMacro.find(item => item.fonte === 'ipcaConsumoEmprego')
  const maiorImpulso = Math.max(0.001, ...impulsos.map(item => Math.abs(item.valor)))
  const historico = estado.historico.slice(-mesesAno)
  const apertoCredito = coef(params, 'bc', 'inadimplenciaAperto')
  const limiteGrafico = Math.max(8, bc.inadimplenciaPct)
  return <div className="coluna">
    <header className="titulo-pagina"><h1>{t('economiaTitulo')}</h1><p>{t('economiaSub')}</p></header>
    <div className="economia-grid">
      <Cartao titulo={t('selic')}>
        <div className="par-numeros"><strong className="numero-grande">{pct(bc.selicAa, 2)}</strong>
          <span className="texto-suave">{t('alvo', { valor: pct(bc.selicAlvoAa, 2) })}</span></div>
        <Dados linhas={[
          { label: t('selicNeutra'), valor: pct(selicNeutraAa, 2) },
          { label: t('statusMonetario'), valor: statusMonetario },
        ]} />
        <BarrasHistorico pontos={historico.map(item => ({ mes: item.mes, valor: item.bc.selicAa }))} percentual />
        <p className="rodape-cartao">{t('selicNota')}</p>
      </Cartao>
      <Cartao titulo={t('ipca')} detalhe={<span className="texto-suave">{t('metaIpca', { valor: pct(coef(params, 'macro', 'ipcaMetaAnual'), 0) })}</span>}>
        <div className="par-numeros"><strong className="numero-grande">{pct(macro.ipca12mPct, 2)}</strong>
          <span className="texto-suave">{t('noMes', { valor: pct(macro.ipcaMensalPct, 2) })}</span></div>
        {consumoNoIpca && <Dados linhas={[{
          label: nomeImpulso(consumoNoIpca.fonte),
          valor: t('noMes', { valor: pp(consumoNoIpca.valor, 3, true) }),
        }]} />}
        <ul className="lista-regimes">{Object.entries(textos.regimes).map(([id, [nome, descricao]]) =>
          <li key={id} aria-current={id === macro.regimeInflacao ? 'true' : undefined}><span>{nome}</span><span>{descricao}</span></li>,
        )}</ul>
      </Cartao>
      <Cartao titulo={t('pib')} detalhe={<span className="texto-suave">{t('potencial', { valor: pct(coef(params, 'macro', 'pibPotencial')) })}</span>}>
        <div className="par-numeros"><strong className="numero-grande">{pct(macro.pibReal12mPct, 2)}</strong>
          <span className="texto-suave">{t('pibNominal')} · {bilhoes(macro.pibNominalMensalBi)}</span></div>
        <h3 className="rotulo rotulo-secao">{t('impulsos')}</h3>
        {impulsos.length ? <dl className="fluxo fluxo-impulsos">
          {impulsos.map(({ fonte, valor }, i) =>
            <div key={`${fonte}-${i}`}><dt>{nomeImpulso(fonte)}</dt>
              <Barra valor={Math.abs(valor)} maximo={maiorImpulso} tom={valor < 0 ? 'negativo' : 'positivo'} />
              <dd>{pp(valor, 3, true)}</dd></div>,
          )}
        </dl> : <p className="texto-suave">{t('impulsosVazios')}</p>}
      </Cartao>
      <Cartao titulo={t('dolarReservas')}>
        <div className="par-numeros">
          <strong className="numero-grande">{cotacao(macro.dolar)}</strong>
          <span className="texto-suave">{t('alvo', { valor: cotacao(macro.dolarAlvo) })}</span>
        </div>
        <BarrasHistorico pontos={historico.map(item => ({ mes: item.mes, valor: item.macro.dolar }))} tom="negativo" />
        <Dados linhas={[
          { label: t('reservas'), valor: usdBi(bc.reservasUsdBi) },
          { label: t('intervencao'), valor: usdBi(bc.vendaReservasUsdBi) },
        ]} />
        <p className="rodape-cartao">{t('cambioNota', { valor: pct(coef(params, 'bc', 'altaDolarIntervencaoPct'), 0) })}</p>
      </Cartao>
      <Cartao titulo={t('credito')}>
        <div className="resumo-incentivos dois-numeros">
          <div><span className="rotulo">{t('credito12m')}</span><strong>{pct(bc.crescimentoCredito12mPct)}</strong></div>
          <div><span className="rotulo">{t('inadimplencia')}</span><strong>{pct(bc.inadimplenciaPct)}</strong></div>
        </div>
        <div className="inadimplencia-trilho">
          <Barra valor={bc.inadimplenciaPct} maximo={limiteGrafico} tom={bc.inadimplenciaPct > apertoCredito ? 'negativo' : 'neutro'} />
          <span aria-hidden style={{ left: `${apertoCredito * 100 / limiteGrafico}%` }} />
        </div>
        <p className="nota-parcial">{t('apertoCredito', { valor: pct(apertoCredito, 0) })}</p>
        <p className="rodape-cartao">{t('creditoNota', { valor: pct(apertoCredito, 0) })}</p>
      </Cartao>
      <Cartao titulo={t('indicadoresFixos')} className="cartao-interno">
        <Dados linhas={[
          { label: t('pix'), valor: `${trilhoes(coef(params, 'bc', 'pixAnualBi'))} · ${t('transacoes', { valor: num(coef(params, 'bc', 'pixTransacoesBi')) })}` },
          { label: t('cartoes'), valor: `${trilhoes(coef(params, 'bc', 'cartoesAnualBi'))} · ${t('transacoes', { valor: num(coef(params, 'bc', 'cartoesTransacoesBi')) })}` },
          { label: t('compulsorio'), valor: pct(coef(params, 'bc', 'compulsorioVistaPct'), 0) },
        ]} />
      </Cartao>
    </div>
  </div>
}

function CartaoSegmento({ segmento, pressaoEntrada }: { segmento: Segmento; pressaoEntrada: number }) {
  const texto = textoSegmento(segmento.id)
  return <article className="cartao-segmento" data-pressao={segmento.pressionando}>
    <h3>{texto?.[0] ?? segmento.id}</h3>
    <strong>{pct(segmento.satisfacao, 0)}</strong>
    <div className="segmento-barra">
      <Barra valor={segmento.satisfacao} tom={segmento.pressionando ? 'negativo' : 'positivo'} />
      <span aria-hidden="true" style={{ left: `${pressaoEntrada}%` }} />
    </div>
    <p>{t(segmento.pressionando ? 'segmentoPressao' : 'segmentoEstavel')}</p>
    {segmento.pressionando && texto && <small>{texto[1]}</small>}
  </article>
}

export function Povo({ estado }: { estado: GameState }) {
  const params = usarParametros()
  const pressaoEntrada = coef(params, 'social', 'pressaoEntrada')
  const pressaoSaida = coef(params, 'social', 'pressaoSaida')
  const pressaoTeto = coef(params, 'social', 'pressaoTeto')
  const { social, macro } = estado
  return <div className="povo-grid">
    <div className="coluna">
      <Cartao className="caixa-heroi">
        <p className="rotulo">{t('porClasse')}</p>
        <strong className="numero-grande">{pct(social.aprovacaoGeral, 0)}</strong>
        {social.aprovacaoGeral === null && <p>{t('aprovacaoPendente')}</p>}
        <dl className="classe-dados">
          {CLASSES.map(classe => {
            const taxa = social.aprovacaoPorClasse?.[classe] ?? null
            return <div key={classe}>
              <dt>{t('classe', { classe })}<small>{t('populacao', { valor: pct(params.classes[classe].participacaoPct) })}</small></dt>
              <Barra valor={taxa ?? 0} /><dd>{pct(taxa, 0)}</dd>
            </div>
          })}
        </dl>
        <p className="rodape-cartao">{t('aprovacaoNota')}</p>
      </Cartao>
      <Cartao titulo={t('miseria')}>
        <div className="par-numeros">
          <strong className="numero-grande">{num(social.indiceMiseria)}</strong>
          <span className="texto-suave">{t('inicio', { valor: num(params.iniciais.ipca12mPct + params.iniciais.desempregoPct) })}</span>
        </div>
        <Dados linhas={[
          { label: t('ipca'), valor: pct(macro.ipca12mPct) },
          { label: t('desemprego'), valor: pct(social.desempregoPct) },
        ]} />
      </Cartao>
      <Cartao titulo={t('desemprego')}>
        <strong className="numero-grande">{pct(social.desempregoPct)}</strong>
        {social.efeitosDesempregoPpAnual && <>
          <Dados linhas={[
            { label: t('pib'), valor: t('pontosPorAno', { valor: sinal(social.efeitosDesempregoPpAnual.pib, 2) }) },
            { label: t('ipca'), valor: t('pontosPorAno', { valor: sinal(social.efeitosDesempregoPpAnual.ipca, 2) }) },
          ]} />
          <p className="texto-suave">{t('desempregoEfeitosAnuais')}</p>
        </>}
        <p className="rodape-cartao">{t('desempregoNota', {
          limite: pct(coef(params, 'social', 'desempregoLimitePct')),
          teto: pct(coef(params, 'social', 'desempregoTetoPct')),
          ipca: pct(coef(params, 'social', 'ipcaDesempregoReferenciaPct')),
        })}</p>
      </Cartao>
      <Cartao titulo={t('consumoEmpregoAnual')}>
        <strong className="numero-grande compacto">
          {social.consumoEmpregoPctPibAnual === undefined ? num(null)
            : t('parcelaPibAnual', { valor: sinal(social.consumoEmpregoPctPibAnual, 3) })}
        </strong>
        {social.consumoEmpregoPctPibAnual !== undefined && <p className="texto-suave">
          {t('variacaoConsumoFamiliasAnual', {
            valor: sinal(social.consumoEmpregoPctPibAnual * params.iniciais.pibAnualBi / params.iniciais.consumoFamiliasAnualBi, 2),
          })}
        </p>}
        <p className="rodape-cartao">{t('consumoEmpregoAnualNota', {
          valor: pct(params.iniciais.desempregoPct),
          aceleracao: pct(coef(params, 'social', 'consumoEmpregoInicioAceleracaoPct')),
        })}</p>
      </Cartao>
    </div>
    <Cartao titulo={t('segmentosTitulo', { total: social.segmentos.length })}
      detalhe={<span className="etiqueta">{t('pressoesTeto', { ativas: social.pressoesExibidas.length, teto: pressaoTeto })}</span>}
    >
      <p className="texto-suave">{t('segmentosNota')}</p>
      <div className="segmentos-grid">
        {social.segmentos.map(segmento => <CartaoSegmento key={segmento.id} segmento={segmento} pressaoEntrada={pressaoEntrada} />)}
      </div>
      <p className="rodape-cartao">{t('pressaoLimiares', { entrada: pct(pressaoEntrada, 0), saida: pct(pressaoSaida, 0) })}</p>
    </Cartao>
  </div>
}
