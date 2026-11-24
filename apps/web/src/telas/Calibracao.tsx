import { useState } from 'react'
import { coeficientesCalibraveis, type Parametros } from '@govgame/engine'
import { ArrowLeft, Search } from 'lucide-react'
import { Aviso } from '../componentes/base'
import { usarPartida, type AlteracaoCoeficiente } from '../store/partida'
import { t, textos } from '../viewmodels/textos'

const estados = {
  confirmado: 'calibracaoConfirmado',
  a_confirmar: 'calibracaoAConfirmar',
  pendente: 'pendente',
} as const

const nomeMotor = (motor: string) => motor === 'turno'
  ? t('calibracaoTurno')
  : textos.motores[motor as keyof typeof textos.motores]?.[0] ?? motor

const exibir = (valor: number) => String(valor).replace('.', ',')
const grupos = {
  economia: 'calibracaoEconomia',
  contasPublicas: 'calibracaoContas',
  social: 'calibracaoSocial',
  politica: 'calibracaoPolitica',
} as const
const normalizarBusca = (valor: string) => valor.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')

function mensagemErro(detalhe: string) {
  if (detalhe === 'resultadoNaoFinito') return t('calibracaoErroResultado')
  if (/^(aliquota|gasto|incentivo)ForaLimite:/.test(detalhe)) return t('calibracaoErroDecisoes')
  return detalhe
}

export default function Calibracao({ parametros }: { parametros: Parametros }) {
  const { ocupado, aplicarCoeficientes, navegar } = usarPartida()
  const [grupoAtivo, setGrupo] = useState<keyof typeof grupos>('economia')
  const [busca, setBusca] = useState('')
  const [edicoes, setEdicoes] = useState<Record<string, string>>({})
  const [erros, setErros] = useState<string[] | null>(null)
  const [aplicado, setAplicado] = useState(false)
  const termo = normalizarBusca(busca.trim())
  const coeficientes = coeficientesCalibraveis.map(entrada => ({
    ...entrada, item: parametros.coeficientes[entrada.motor][entrada.chave],
  }))
  const linhas = coeficientes.filter(({ motor, id, nome, grupo, item }) => termo
    ? normalizarBusca(`${nome} ${id} ${nomeMotor(motor)} ${item.fonte}`).includes(termo)
    : grupo === grupoAtivo)
  const totalEdicoes = Object.keys(edicoes).length

  async function aplicar() {
    const alteracoes: AlteracaoCoeficiente[] = []
    const invalidos = []
    for (const { motor, chave, id } of coeficientes) {
      if (!Object.hasOwn(edicoes, id)) continue
      const entrada = edicoes[id].trim()
      const valor = entrada === '' ? null : Number(entrada.replace(',', '.'))
      if (valor !== null && (!/^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)(?:e[+-]?\d+)?$/i.test(entrada) || !Number.isFinite(valor))) {
        invalidos.push(t('calibracaoNumeroInvalido', { chave: id }))
      } else {
        alteracoes.push({ motor, chave, valor })
      }
    }
    if (invalidos.length) {
      setErros(invalidos)
      return
    }
    setErros(null)
    const resultado = await aplicarCoeficientes(alteracoes)
    if (resultado.ok) {
      setEdicoes({})
      setAplicado(true)
    } else {
      setErros([...new Set(resultado.detalhes.map(mensagemErro))])
    }
  }

  return <div className="coluna calibracao">
    <header className="fechamento-cabecalho titulo-pagina">
      <div><h1>{t('calibracaoTitulo')}</h1><p>{t('calibracaoDescricao')}</p></div>
      <button className="botao botao-secundario" type="button" disabled={ocupado} onClick={() => navegar('painel')}>
        <ArrowLeft size={16} aria-hidden="true" />{t('calibracaoVoltar')}
      </button>
    </header>
    <div className="calibracao-grid">
      <nav aria-label={t('calibracaoGrupos')} className="cartao calibracao-motores">
        <h2>{t('calibracaoGrupos')}</h2>
        {(Object.keys(grupos) as (keyof typeof grupos)[]).map(grupo => <button type="button" key={grupo}
          aria-current={!termo && grupo === grupoAtivo ? 'true' : undefined}
          onClick={() => { setGrupo(grupo); setBusca('') }}
        >{t(grupos[grupo])}</button>)}
      </nav>
      <form className="cartao calibracao-editor" onSubmit={evento => { evento.preventDefault(); void aplicar() }}>
        <div className="calibracao-ferramentas">
          <label className="calibracao-busca">
            <Search size={18} aria-hidden="true" />
            <input type="search" aria-label={t('calibracaoBuscar')} placeholder={t('calibracaoBuscar')}
              value={busca} onChange={evento => setBusca(evento.target.value)}
            />
          </label>
          <div className="acoes">
            <button type="button" className="botao botao-secundario" disabled={ocupado || !totalEdicoes}
              onClick={() => { setEdicoes({}); setErros(null); setAplicado(false) }}
            >{t('calibracaoDescartar')}</button>
            <button type="submit" className="botao botao-verde" disabled={ocupado || !totalEdicoes}>
              {t(ocupado ? 'calibracaoAplicando' : 'calibracaoAplicar')}
            </button>
          </div>
        </div>
        <div className="calibracao-retorno">
          {aplicado && <p role="status" className="tom-positivo">{t('calibracaoAplicada')}</p>}
          {erros && <Aviso erro>
            <strong>{t('calibracaoErro')}</strong>
            {!!erros.length && <ul>{erros.map(erro => <li key={erro}>{erro}</li>)}</ul>}
          </Aviso>}
          <p className="texto-suave">{t('calibracaoDica')}</p>
        </div>
        {linhas.length ? <table className="calibracao-tabela">
          <thead><tr>
            <th scope="col">{t('calibracaoCoeficiente')}</th>
            <th scope="col">{t('calibracaoAtual')}</th>
            <th scope="col">{t('calibracaoNovo')}</th>
          </tr></thead>
          <tbody>{linhas.map(({ nome, id, item, faixa }) => {
            const atual = item.valor === null ? '' : exibir(item.valor)
            return <tr key={id} data-editado={Object.hasOwn(edicoes, id)}>
              <th scope="row">
                <strong>{nome}</strong>
                <small>{id} · {item.fonte}</small>
                {faixa && <small>{t('calibracaoFaixa', { baixo: exibir(faixa.baixo), alto: exibir(faixa.alto) })}</small>}
              </th>
              <td><strong>{atual || '—'}</strong><small>{t(estados[item.status])}</small></td>
              <td><input type="text" inputMode="decimal" aria-label={t('calibracaoEntrada', { chave: nome })}
                  value={edicoes[id] ?? atual} disabled={ocupado} onChange={evento => {
                    const valor = evento.target.value
                    setAplicado(false)
                    setEdicoes(anteriores => {
                      const proximas = { ...anteriores }
                      if (valor === atual) delete proximas[id]
                      else proximas[id] = valor
                      return proximas
                    })
                  }}
                /></td>
            </tr>
          })}</tbody>
        </table> : <p className="texto-suave">{t('calibracaoVazio')}</p>}
      </form>
    </div>
  </div>
}
