import type { CSSProperties } from 'react'
import {
  CLASSES, INSTRUMENTOS, MINISTERIOS, SETORES, coef,
  type Decisoes, type GameState, type PreviewFiscal,
} from '@govgame/engine'
import { Barra, Cartao, Dados, SliderAliquota, SliderZonas } from '../componentes/base'
import { usarParametros } from '../store/partida'
import {
  aliquotasPorClasse, anualizar, biAssinado, bilhoes, bilhoesPorAno, bilhoesPorMes, gastosPorMinisterio, incentivo,
  num, pct, pp, resumoIncentivos, tomDoSaldo,
} from '../viewmodels/jogo'
import { t, textos } from '../viewmodels/textos'

type EditorProps = {
  estado: GameState; decisoes: Decisoes; previa: PreviewFiscal
  ajustar: (alterar: (decisoes: Decisoes) => Decisoes) => void
}

export function Gastos({ estado, decisoes, previa, ajustar }: EditorProps) {
  const params = usarParametros()
  const linhas = gastosPorMinisterio(estado, decisoes, previa, params)
  const criticos = linhas.filter(item => item.tom === 'negativo')
  const { fluxo } = previa

  return <div className="editor-grid">
    <section className="cartao cartao-tabela">
      <header className="cabecalho-tabela">
        <div><h1>{t('gastosTitulo')}</h1><p>{t('gastosSub', { total: MINISTERIOS.length })}</p></div>
        <div className="legenda-zonas">
          <span className="legenda-critica">{t('criticaPiso')}</span>
          <span className="legenda-normal">{t('ajuste')}</span>
          <span className="legenda-expansao">{t('expansao')}</span>
        </div>
      </header>
      <table className="tabela-controles tabela-gastos">
        <thead><tr>
          <th scope="col">{t('ministerio')}</th><th scope="col">{t('controle')}</th>
          <th scope="col" className="alinhar-direita">{t('valorAno')}</th><th scope="col" className="alinhar-direita">{t('pisoLabel')}</th><th scope="col">{t('situacao')}</th>
        </tr></thead>
        <tbody>
          <tr className="linha-fixa">
            <th scope="row">{t('previdencia')}<small>{t('previdenciaNota')}</small></th>
            <td><em>{t('fixoNota')}</em></td>
            <td className="valor-tabela">{num(anualizar(fluxo.previdenciaBi), 2)}</td><td className="alinhar-direita">{num(null)}</td><td>{t('fixo')}</td>
          </tr>
          {linhas.map(linha => {
            const { id, zonas, tom } = linha
            const background = `linear-gradient(to right, var(--cor-vermelho-borda) 0% ${zonas.piso}%, var(--cor-cinza-zona) ${zonas.piso}% ${zonas.expansao}%, var(--cor-verde-zona) ${zonas.expansao}% 100%)`
            return <tr key={id} data-critico={tom === 'negativo'}>
              <th scope="row">{linha.nome}{linha.descricao && <small>{linha.descricao}</small>}</th>
              <td><SliderZonas label={linha.nome} valor={linha.valor} referencia={linha.referencia} maximo={linha.maximo}
                onChange={valor => ajustar(atual => ({ ...atual, gastosDiscricionariosBi: { ...atual.gastosDiscricionariosBi, [id]: valor } }))}
                zonas={background} tom={tom} formato={valor => bilhoesPorAno(valor, 2)}
              /></td>
              <td className="valor-tabela">{num(anualizar(linha.total), 2)}<small className={`tom-${tom}`}>{t('variacaoInicial', { valor: linha.delta })}</small></td>
              <td className="alinhar-direita">{num(anualizar(linha.piso), 2)}</td>
              <td className={`tom-${tom}`}><strong>{linha.situacao}</strong><small>{t('notaServico', { nota: num(linha.servico.nota, 0) })}</small></td>
            </tr>
          })}
        </tbody>
      </table>
    </section>
    <aside className="coluna">
      <Cartao titulo={t('resumoMes')}>
        <Dados linhas={[
          { label: t('ministeriosQuantidade', { total: MINISTERIOS.length }), valor: bilhoesPorMes(Object.values(fluxo.gastosBi).reduce((a, b) => a + b, 0), 2) },
          { label: t('previdencia'), valor: bilhoesPorMes(fluxo.previdenciaBi, 2) },
          { label: t('subsidios'), valor: bilhoesPorMes(fluxo.subsidiosBi, 2) },
          { label: t('despesaPrimaria'), valor: bilhoesPorMes(fluxo.despesaPrimariaBi, 2), total: true },
          { label: t('resultadoPrimario'), valor: biAssinado(fluxo.resultadoPrimarioBi, 2) + '/mês', tom: tomDoSaldo(fluxo.resultadoPrimarioBi), total: true },
        ]} />
      </Cartao>
      {criticos.length > 0 && <Cartao titulo={t('gastosCriticos', { total: criticos.length })} className="cartao-critico">
        <ul className="lista-compacta">{criticos.map(item => <li key={item.id}><strong>{item.nome}</strong> · {t('piso', { valor: bilhoesPorAno(item.piso, 2) })}</li>)}</ul>
        <p className="rodape-cartao">{t('gastosCriticosNota')}</p>
      </Cartao>}
      <Cartao titulo={t('controleAjuda')}><p className="texto-corpo">{t('controleGastoNota')}</p></Cartao>
    </aside>
  </div>
}

export function Receitas({ estado, decisoes, previa, ajustar }: EditorProps) {
  const params = usarParametros()
  const irMaximo = coef(params, 'ir', 'aliquotaMaxima')
  const lafferLimiar = coef(params, 'ir', 'lafferLimiar')
  const lafferPiso = coef(params, 'ir', 'lafferPiso') * 100
  const carenciaMeses = coef(params, 'turno', 'carenciaMeses')
  const { ir, irAnunciado, fluxo } = previa
  return <div className="coluna">
    <div className="editor-grid">
      <section className="cartao cartao-tabela">
        <header className="cabecalho-tabela">
          <div><h1>{t('irTitulo')}</h1><p>{t('irSub', { total: CLASSES.length })}</p></div>
          <div className="legenda-zonas">
            <span className="legenda-referencia">{t('referencia2025')}</span>
            <span className="legenda-projetado">{t('aliquotaProjetada')}</span>
            <span className="legenda-evasao">{t('evasao', { valor: pct(lafferLimiar, 0) })}</span>
          </div>
        </header>
        <table className="tabela-controles tabela-ir">
          <thead><tr>
            <th scope="col">{t('classeLabel')}</th><th scope="col">{t('aliquota')}</th>
            <th scope="col" className="alinhar-direita">{t('arrecadacaoClasse')}<small>{t('aliquotasAnunciadas')}</small></th>
            <th scope="col">{t('situacao')}</th>
          </tr></thead>
          <tbody>
            {aliquotasPorClasse(estado, decisoes, previa, params).map(linha =>
              <tr key={linha.classe}>
                <th scope="row">{linha.nome}<small>{linha.descricao}</small><small>{linha.base}</small></th>
                <td><div className="linha-aliquota">
                  <SliderAliquota label={t('aliquotaClasse', { classe: linha.classe })}
                    valor={linha.valor} referencia={linha.referencia} projetada={linha.projetada} tom={linha.tom}
                    onChange={valor => ajustar(atual => ({ ...atual, aliquotasPct: { ...atual.aliquotasPct, [linha.classe]: valor } }))}
                  />
                  <div className="valor-tabela">{pct(linha.valor)}<small>{t('referencia', { valor: pct(linha.referencia) })}</small></div>
                </div></td>
                <td className="valor-tabela valor-ir">{linha.arrecadacao}
                  <small>{t('aliquotaProjetadaValor', { valor: pct(linha.projetada) })}</small>
                  {linha.arrecadacaoNoMes && <small>{t('arrecadacaoNoNominal', { valor: linha.arrecadacaoNoMes })}</small>}
                </td><td className={`tom-${linha.tom}`}>{linha.situacao}</td>
              </tr>,
            )}
          </tbody>
        </table>
        <p className="rodape-tabela">{t('irAjuda', { meses: carenciaMeses, limiar: pct(lafferLimiar, 0), piso: pct(lafferPiso, 0) })}</p>
      </section>
      <aside className="coluna">
        <Cartao>
          <p className="rotulo">{t('arrecadacaoIr')}</p>
          <strong className="numero-grande" aria-live="polite">{bilhoesPorAno(irAnunciado.arrecadacaoBi, 2)}</strong>
          <p className="texto-suave">{t('aliquotasAnunciadas')}</p>
          {ir.arrecadacaoBi !== irAnunciado.arrecadacaoBi && <p className="texto-suave">
            {t('arrecadacaoNoNominal', { valor: bilhoesPorAno(ir.arrecadacaoBi, 2) })}
          </p>}
        </Cartao>
        <Cartao titulo={t('justica')}>
          <p className="texto-suave">{t('justicaDef')}</p>
          <strong className="numero-grande">{pp(ir.progressividadePp, 2)}</strong>
          <Barra valor={ir.progressividadePp} maximo={irMaximo} tom={ir.penalidadeInjustica < 0 ? 'negativo' : 'positivo'} />
          <Dados linhas={[
            { label: t('injustica'), valor: pp(ir.penalidadeInjustica, 1, true), tom: tomDoSaldo(ir.penalidadeInjustica) },
            { label: t('fuga'), valor: num(ir.fugaCapital) },
          ]} />
        </Cartao>
        <Cartao titulo={t('orcamentoProjetado')} className="cartao-interno">
          <Dados linhas={[
            { label: t('consumo'), valor: bilhoes(fluxo.receitaConsumoBi, 2) },
            { label: t('empresas'), valor: bilhoes(fluxo.receitaEmpresasBi, 2) },
            { label: t('outrasReceitas'), valor: bilhoes(fluxo.receitaOutrasBi, 2) },
            { label: t('ajusteReceitaRenuncias'), valor: biAssinado(fluxo.variacaoRenunciasBi, 2), tom: tomDoSaldo(fluxo.variacaoRenunciasBi) },
            { label: t('receitaTotalProjetada'), valor: bilhoes(fluxo.receitaTotalBi, 2), total: true },
            { label: t('despesaPrimaria'), valor: bilhoes(fluxo.despesaPrimariaBi, 2), total: true },
          ]} />
        </Cartao>
      </aside>
    </div>
    <section className="cartao cartao-tabela">
      <header className="cabecalho-tabela">
        <div><h2>{t('incentivosTitulo')}</h2><p>{t('incentivosSub', { total: SETORES.length })}</p></div>
        <div className="resumo-incentivos">
          {resumoIncentivos(previa).map(({ rotulo, valor }) =>
            <div key={rotulo}><span className="rotulo">{rotulo}</span><strong>{valor}</strong></div>,
          )}
        </div>
      </header>
      <table className="tabela-controles tabela-incentivos">
        <thead><tr><th scope="col">{t('setor')}</th><th scope="col">{t('renuncia')}</th><th scope="col">{t('subsidio')}</th></tr></thead>
        <tbody>
          {SETORES.map(setor =>
            <tr key={setor}>
              <th scope="row">{textos.setores[setor]}</th>
              {INSTRUMENTOS.map(instrumento => {
                const item = incentivo(estado, decisoes, setor, instrumento, previa, params)
                const { zonas } = item
                const style = {
                  '--inicio-integral': `${zonas.inicial}%`, '--inicio-metade': `${zonas.integral}%`, '--inicio-custo': `${zonas.metade}%`,
                } as CSSProperties
                return <td key={instrumento} style={item.disponivel ? style : undefined}>
                  {item.disponivel
                    ? <div>
                      <div className="resumo-controle">
                        <strong>{item.montante} · {item.delta}</strong><span className={`tom-${item.tom}`}>{item.situacao}</span>
                      </div>
                      <SliderZonas label={item.label} valor={item.valor} maximo={item.maximo} referencia={item.referencia}
                        tom={item.tom} formato={bilhoesPorAno} zonas="var(--gradiente-incentivo)"
                        onChange={valor => ajustar(atual => ({
                          ...atual, incentivosBi: { ...atual.incentivosBi, [setor]: { ...atual.incentivosBi[setor], [instrumento]: valor } },
                        }))}
                      />
                      {item.detalhe && <small>{item.detalhe}</small>}
                      {item.impactoDoMes && <p className="impacto-incentivo">{item.impactoDoMes}</p>}
                      {item.impactoFuturo && <p className="impacto-incentivo">{item.impactoFuturo}</p>}
                    </div>
                    : <span className="texto-suave">{item.descricao}</span>}
                </td>
              })}
            </tr>,
          )}
        </tbody>
      </table>
      <p className="rodape-tabela">{t('incentivosAjuda')}</p>
    </section>
  </div>
}
