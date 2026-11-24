# Interface (`apps/web`)

React + Vite + Zustand + Tailwind. Mockups: subpasta `UI` do Drive e canvas `GovGame — UI do jogo`.

## Telas (desktop, referência de 1440 px)

Barra superior fixa (marca, 6 abas, mês X de 48 e ano X de 4, **Projeção do mês**, botão **Fechar mês**) + faixa de 9 KPIs clicáveis: Aprovação, Desemprego, IPCA 12 meses, Selic, PIB 12 meses, Dólar, Dívida/PIB, Risco Fiscal, Caixa do Tesouro.

| Tela | Conteúdo |
|---|---|
| Painel | Aprovação geral e por classe, histórico, Próximos meses, Fluxo do mês, Risco Fiscal, Em pauta (manchete e pressões), Qualidade dos serviços |
| Gastos | 15 sliders de ministério, Previdência fixa, resumo do mês, aviso de zona crítica |
| Receitas | 5 sliders de IR por classe, justiça tributária, arrecadação, 12 controles de incentivos |
| Tesouro | Risco Fiscal e fatores, prêmio, dívida, projeção, fatura de juros, Caixa, amortização, crise de rolagem |
| Economia | Selic, IPCA e regimes, PIB e impulsos, dólar e reservas, crédito e inadimplência (tela de leitura) |
| Povo | Aprovação por classe, Índice de Miséria, desemprego, 20 segmentos |
| Fechamento | Passo a passo dos motores, tabela mês N → N+1, manchetes e avisos |
| Fim de jogo | Tipo de final, aprovação mês a mês, estatísticas, todos os finais, pontuação final |

## Tokens visuais (do canvas de design)

- Fontes: **Bricolage Grotesque** (600/700, títulos e números grandes) e **IBM Plex Sans** (400/500/600, texto). Sempre `font-variant-numeric: tabular-nums`.
- Layout só para desktop; não há versão mobile. Largura de referência: 1440 px; padding lateral de 32 px; cartões com raio de 14–16 px (herói do Painel: 20 px).

### Paleta

Todas as cores abaixo saem do canvas de design (`GovGame — UI do jogo`). **Não crie cores novas fora desta tabela**; se faltar uma, adicione aqui primeiro.

**Neutros (superfícies e linhas)**

| Token | Hex | Uso |
|---|---|---|
| `fundo` | `#F1EEE6` | Fundo das telas |
| `cartao` | `#FBFAF6` | Cartões e seções |
| `cartao-alt` | `#F6F3EB` | Linha destacada em tabelas (ex.: Previdência) |
| `painel` | `#F4F2EA` | Caixas internas, faixas de prêmio, fundos de fórmula |
| `trilho` | `#EAE6DA` | Trilhos de barra, cabeçalho de tabela, blocos "sem controle" |
| `linha` | `#D9D4C7` | Borda de cartão |
| `linha-suave` | `#E4E0D3` | Divisórias internas, fundo de etiquetas |
| `cinza-trilho` | `#D5DAD3` | Trilho de slider de alíquota |
| `cinza-zona` | `#C4C9C2` | Zona "ajuste normal" e "só custo" |
| `cinza-medio` | `#9CA39B` | Legenda "ajuste normal", bordas tracejadas |
| `cinza-barra` | `#8A8F87` | Barras neutras no Fluxo do mês |

**Texto**

| Token | Hex | Uso | Contraste sobre `cartao` |
|---|---|---|---|
| `tinta` | `#15211C` | Texto principal e barra superior | 15,9 |
| `texto-corpo` | `#3A4540` | Parágrafos explicativos | 9,6 |
| `texto-suave` | `#56615B` | Rótulos, subtítulos, notas | 6,2 |

**Verde (marca, positivo, expansão)**

| Token | Hex | Uso |
|---|---|---|
| `verde` | `#0E5A3C` | Herói de aprovação, botões primários, expansão, melhora |
| `verde-escuro` | `#0A4A30` | Texto sobre `verde-claro` |
| `verde-zona` | `#A9CDB8` | Zona "efeito pela metade" |
| `verde-claro` | `#DCEBE2` | Etiquetas de estado "Inativa" |
| `verde-faixa` | `#CFE3D6` | Faixa 0–35 do Risco Fiscal |

**Âmbar (ação principal, atenção)**

| Token | Hex | Uso |
|---|---|---|
| `ambar` | `#E3A21A` | Botão **Fechar mês**, aba ativa, mínimo do Caixa, barra do ano. **Só como preenchimento, com texto `tinta` (7,5:1).** |
| `ambar-medio` | `#C9961A` | Barras e bordas de alerta, bordas de nota pendente |
| `ambar-texto` | `#7A5200` | Texto de alerta (sobre `ambar-fundo`: 6,4:1) |
| `ambar-nota` | `#5A4200` | Texto das notas pendentes |
| `ambar-faixa` | `#F4DFA8` | Faixa 35–70 do Risco Fiscal, evasão acima de 30% |
| `ambar-fundo` | `#FFF6DE` | Cartão "Perto do limiar" e avisos |
| `ambar-nota-fundo` | `#FFF4D6` | Notas de pendência nos mockups |

**Vermelho (negativo, crítico, risco)**

| Token | Hex | Uso |
|---|---|---|
| `vermelho` | `#B8322A` | Piso rompido, queda, déficit, pressão ativa (sobre `cartao`: 5,7:1; sobre `vermelho-fundo`: 4,8:1) |
| `vermelho-escuro` | `#7A2B25` | Texto sobre fundos vermelhos claros |
| `vermelho-final` | `#7A1F18` | Herói da tela de Fim de jogo (texto branco: 10,3:1) |
| `vermelho-fundo` | `#F7E3E0` | Avisos críticos, linha em zona crítica, manchete |
| `vermelho-linha` | `#FCEFED` | Fundo de linha em zona crítica, cartão de pressão |
| `vermelho-borda` | `#E7B3AE` | Zona crítica do slider, borda de aviso crítico |
| `vermelho-faixa` | `#EDC3BE` | Faixa 70–100 do Risco Fiscal |
| `vermelho-claro` | `#FFB4AB` | Projeção Nominal negativa sobre a barra escura |
| `vermelho-claro-2` | `#FFD9D4` | Legenda sobre o herói verde |

**Barra superior (escura)**

| Token | Hex | Uso |
|---|---|---|
| `topo` | `#15211C` | Fundo (igual a `tinta`) |
| `topo-texto-2` | `#C9D1CB` | Abas inativas (10,6:1) |
| `topo-texto-3` | `#B8C2BB` | Subtítulo e legendas (9,1:1) |
| `topo-trilho` | `#3B4A42` | Segmentos de ano ainda não jogados |

### Significado das cores (regras de uso)

- **Verde = bom / expansão / confirmar.** **Vermelho = ruim / crítico / piso rompido.** **Âmbar = ação principal e atenção.** Cinza = neutro.
- Variação no KPI: ▲/▼ colorido por **efeito para o jogador**, não pela direção do número (dívida subindo = vermelho; aprovação caindo = vermelho).
- Zonas dos sliders de gasto: crítica `vermelho-borda`/`vermelho`, ajuste normal `cinza-zona`, expansão `verde-zona`/`verde`.
- Zonas dos incentivos: integral `verde`, metade `verde-zona`, só custo `cinza-zona`, corte `vermelho`.
- Faixas do Risco Fiscal: 0–35 `verde-faixa`, 35–70 `ambar-faixa`, 70–100 `vermelho-faixa`, marco 90 "crise de rolagem" em `vermelho`.
- Segmentos sociais: estável (borda `linha-suave`, barra `verde`), perto do limiar (`ambar-fundo`, `ambar-medio`), pressão ativa (`vermelho-linha`, `vermelho`).
- Nunca use cor como único sinal: acompanhe com texto ("Crítica", "Pressão ativa") ou ícone, como nos mockups.

### Acessibilidade

- Texto normal precisa de contraste ≥ 4,5:1. Pares já verificados estão nas tabelas acima.
- **`ambar` (2,1:1) e `ambar-medio` (2,6:1) não servem como cor de texto** sobre `fundo`/`cartao`. Use `ambar-texto` para texto de alerta.
- `vermelho` sobre `vermelho-fundo` fica em 4,8:1: ok para texto médio ou negrito; não use em corpo pequeno.

### Tailwind (`apps/web/tailwind.config.ts`)

```ts
export default {
  theme: {
    extend: {
      colors: {
        fundo: '#F1EEE6', cartao: { DEFAULT: '#FBFAF6', alt: '#F6F3EB' },
        painel: '#F4F2EA', trilho: '#EAE6DA',
        linha: { DEFAULT: '#D9D4C7', suave: '#E4E0D3' },
        cinza: { trilho: '#D5DAD3', zona: '#C4C9C2', medio: '#9CA39B', barra: '#8A8F87' },
        tinta: '#15211C', corpo: '#3A4540', suave: '#56615B',
        verde: { DEFAULT: '#0E5A3C', escuro: '#0A4A30', zona: '#A9CDB8', claro: '#DCEBE2', faixa: '#CFE3D6' },
        ambar: { DEFAULT: '#E3A21A', medio: '#C9961A', texto: '#7A5200', nota: '#5A4200',
                 faixa: '#F4DFA8', fundo: '#FFF6DE', 'nota-fundo': '#FFF4D6' },
        vermelho: { DEFAULT: '#B8322A', escuro: '#7A2B25', final: '#7A1F18', fundo: '#F7E3E0',
                    linha: '#FCEFED', borda: '#E7B3AE', faixa: '#EDC3BE', claro: '#FFB4AB', 'claro-2': '#FFD9D4' },
        topo: { DEFAULT: '#15211C', 'texto-2': '#C9D1CB', 'texto-3': '#B8C2BB', trilho: '#3B4A42' },
      },
      fontFamily: {
        titulo: ['"Bricolage Grotesque"', 'sans-serif'],
        texto: ['"IBM Plex Sans"', 'sans-serif'],
      },
    },
  },
}
```

Os mesmos valores devem existir como variáveis CSS (`--cor-verde`, etc.) se algum componente (SVG, gráficos) precisar delas fora do Tailwind. A fonte única de verdade é este arquivo e o canvas; mantenha os dois em sincronia.

## Componentes reutilizáveis

- `SliderZonas` — Gastos (crítica / ajuste normal / expansão) e incentivos (integral / metade / só custo). Marca o valor inicial e o piso; escala de 0 a **1,3× o valor inicial**.
- `SliderAliquota` — escala de 0 a 40%, marca de referência de 2025, faixa hachurada de evasão acima de 30%.
- `BarraFaixas` — Risco Fiscal (35, 70, 90) e inadimplência (6%).
- `TopBar` e `Hud`; `CartaoSegmento`; `ResumoDoMotor`; `Manchete`; `Aviso`; séries históricas (Recharts/SVG).

## View-models

Regras puramente de apresentação (zona do slider, rótulo "Expansão · efeito pela metade", cor de status, conversão mensal/anual) ficam em `apps/web/src/viewmodels/`, **nunca** no motor e nunca espalhadas em componentes.

## Estado da UI

Zustand com três pedaços: `estadoCommitado`, `rascunhoDecisoes`, `resultadoPendente`. Valores derivados (preview, projeção, agenda) vêm de seletores memoizados chamando o motor. Se `projetar()` pesar, mover para um Web Worker.
