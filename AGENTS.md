# AGENTS.md — GovGame

Guia para agentes (e pessoas) que trabalham no GovGame: simulador de governo por turnos, baseado em dados de 2025, que roda **localmente no PC como aplicação web (desktop, não mobile)**.

> Estado do projeto: **o repositório ainda não existe**. Estes arquivos descrevem a arquitetura e a stack decididas até agora. Comandos marcados com *(a criar)* serão criados junto com o esqueleto do monorepo.

---

## 1. Fonte da verdade

As regras do jogo **não** vivem no código nem neste arquivo. Elas estão nos documentos Markdown em `docs/motores/` (um por motor), nos mockups da pasta `UI/` e no canvas de design. A raiz do repositório é a própria pasta **GovGame** do Google Drive.

| Documento (Drive) | Caminho | Conteúdo |
|---|---|---|
| [MotorTurno](https://drive.google.com/file/d/1_jg9d7QEAfg2TnveGX0AOG6gj9ggTXWm/view) | `docs/motores/MotorTurno.md` | Orquestrador, ordem de execução, histórico guardado, fim de jogo |
| [MotorIR](https://drive.google.com/file/d/1DihsZKUhG4DxFdvaNRuHYT79qAR91PEI/view) | `docs/motores/MotorIR.md` | Imposto de Renda por classe, Curva de Laffer, justiça tributária, fuga de capital |
| [MotorSubsidios](https://drive.google.com/file/d/18bpoi94Qj44W_3r9IGercV2o9JILvX9F/view) | `docs/motores/MotorSubsidios.md` | 6 setores × 2 instrumentos (renúncia e subsídio direto) |
| [MotorOrcamento](https://drive.google.com/file/d/1JiT71p6mnHvooDC3vik2HfbQjnWrX3_I/view) | `docs/motores/MotorOrcamento.md` | Receitas, 15 ministérios, piso, juros, dívida, Risco Fiscal, Caixa, crise de rolagem |
| [MotorBC](https://drive.google.com/file/d/1dmIY43dh4Zc9NkwVEWAg6VYkQ7wzxQll/view) | `docs/motores/MotorBC.md` | Selic por regra, crédito, inadimplência, câmbio e reservas |
| [MotorMacro](https://drive.google.com/file/d/11DExw-V_3RFD34Ut290FZ3dgWI7Dsd9t/view) | `docs/motores/MotorMacro.md` | PIB, IPCA, dólar, regimes de inflação |
| [MotorSocial](https://drive.google.com/file/d/18q5AqiniccUh1ZACV47BZaGxuDxg_3tv/view) | `docs/motores/MotorSocial.md` | Aprovação por classe, Índice de Miséria, desemprego, 20 segmentos e pressões |

Regras para agentes:

- **Não invente coeficientes, limiares nem fórmulas.** Se faltar algo, registre como pendência em `docs/pendencias.md` e pergunte ao Lauro.
- **Não edite os documentos dos motores** sem pedido explícito. Eles são refinados por ele, um motor por vez.
- Cada decisão nos documentos tem um status: `[CONFIRMADO]`, `[A CONFIRMAR]` ou `[PENDENTE]`. Esse status acompanha o valor nos arquivos de dados (`data/AGENTS.md`).
- Em conflito entre documento e mockup, **vale o documento do motor**. Registre a divergência em `docs/pendencias.md`.

---

## 2. Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Linguagem | **TypeScript** (`strict`) em tudo | Um só código para o motor no navegador e nos scripts de calibração |
| Gerenciador | pnpm workspaces | Monorepo simples |
| Interface | **React + Vite**, Zustand, Tailwind (+ Radix para primitivos) | Sem SSR nem SEO; app local desktop |
| Gráficos | Recharts + SVG próprio | Séries de até 48 meses; barras e faixas customizadas |
| Validação | **zod** | Schemas dos parâmetros e das decisões |
| Testes | **Vitest** (+ fast-check para propriedades) | Testes dourados com os números dos documentos |
| Servidor local | Node + **Fastify** | Fino: só saves, histórico e simulações em lote |
| Banco | **SQLite** (`better-sqlite3` + Drizzle) | Um arquivo local, fácil de inspecionar na calibração |
| Empacotamento (futuro) | Tauri, se quiser app instalável | Não é prioridade |

Por que não Python / Next.js / Postgres: Python duplicaria as regras entre motor e jogo; Next.js não traz nada sem SSR; Postgres é excesso para uso local e single-player.

---

## 3. Estrutura do repositório (alvo)

```
govgame/
├─ AGENTS.md                   # este arquivo (raiz)
├─ UI/                         # mockups (PNGs)
├─ .codex/agents/              # subagentes do Codex (.toml)
├─ docs/
│  ├─ motores/                 # os 7 documentos dos motores (.md)
│  └─ motores-resumo.md · pendencias.md · orquestracao.md · primeiros-passos.md
├─ packages/
│  └─ engine/                  # TS puro: sem DOM, I/O, Date, Math.random (+ AGENTS.md)
│     └─ src/
│        ├─ estado.ts          # GameState, Decisoes, ResultadoDoMes, tipos de saída
│        ├─ turno.ts           # fecharMes(): pipeline fixo
│        ├─ preview.ts         # preview() fiscal ao vivo
│        ├─ projecao.ts        # projetar() N meses à frente
│        ├─ agenda.ts          # agenda(): efeitos agendados
│        ├─ manchetes.ts       # regras de manchetes e avisos
│        ├─ fim-de-jogo.ts     # impeachment, calote, hiperinflação, fim normal
│        ├─ motores/           # ir, subsidios, orcamento, bc, macro, social
│        └─ params/            # schemas zod e carregamento dos dados
├─ data/
│  └─ 2025/                    # parâmetros JSON (+ AGENTS.md)
├─ apps/
│  ├─ web/                     # React: telas, store (+ AGENTS.md: UI e paleta)
│  │  └─ src/{telas,componentes,viewmodels,store}/
│  └─ server/                  # Fastify + SQLite (+ AGENTS.md)
└─ tools/
   └─ simulador/               # bots de 48 turnos (+ AGENTS.md)
```

Dependências permitidas: `web` → `engine`; `server` → `engine` (só tipos e simulação em lote); `engine` não depende de nada do projeto. **O motor nunca importa de `apps/`.**

---

## 4. Comandos *(a criar)*

```bash
pnpm install
pnpm dev            # sobe web (Vite) + server (Fastify)
pnpm test           # Vitest em todos os pacotes
pnpm test:engine    # só o motor
pnpm typecheck      # tsc --noEmit
pnpm lint
pnpm sim            # tools/simulador: bots jogam 48 turnos e geram relatório
```

Antes de dar uma tarefa por concluída: `pnpm typecheck && pnpm test`.

---

## 5. Onde ler o quê

O Codex carrega o `AGENTS.md` da pasta em que a sessão trabalha, somado a este. **Antes de mexer numa pasta, leia o `AGENTS.md` dela.**

| Arquivo | Conteúdo |
|---|---|
| `packages/engine/AGENTS.md` | Princípios do motor, API pública, formato de resultado, estado, transação de fechamento, testes de motor |
| `data/AGENTS.md` | Arquivos de dados, status dos coeficientes, unidades |
| `apps/web/AGENTS.md` | Telas, **paleta de cores e tokens**, acessibilidade, Tailwind, componentes, view-models, estado da UI |
| `apps/server/AGENTS.md` | Persistência em SQLite |
| `tools/simulador/AGENTS.md` | Simulador em lote e calibração |
| `docs/motores-resumo.md` | Resumo dos 7 motores (números exatos estão nos documentos) |
| `docs/pendencias.md` | Decisões em aberto e divergências mockup × documento |
| `docs/orquestracao.md` | Subagentes do Codex: fases, pastas por agente, regras |
| `docs/primeiros-passos.md` | Ordem sugerida de implementação |

---

## 6. Decisões de design já tomadas (não reabrir sem pedido)

- **STF fora do jogo por enquanto.** O MotorOrçamento só expõe o estado "abaixo do Piso constitucional" para uso futuro; o nome da regra continua **Piso constitucional**.
- **Não existe MotorGabinete.**
- **Não existe MotorEventos por enquanto** (sem calamidades nem escândalos). Quando voltar, definir o dono do gatilho do socorro de calamidade.
- Socorro financeiro foi incorporado ao **socorro de calamidade** (um só tipo): entra no Resultado Primário, fica **fora** do Risco Fiscal e entra no estoque da dívida.
- Sem penalidade extra no Risco Fiscal por corte de imposto sem compensação.
- Fuga de capital fiscal virou só prêmio de risco; a fuga de capital propriamente dita é exclusiva do MotorIR.
- Selic definida pelo BC por regra; o jogador não a controla.
- O MotorSocial é o único escritor de Aprovação e Desemprego; os demais motores devolvem só variações.
- Ordem de refino dos motores: Subsídios (fechado) → Social (fechado) → BC (em andamento) → Macro → Turno.

---

## 7. Convenções de código

- TypeScript `strict`; sem `any`; sem `Date`/`Math.random` no motor.
- Nomes de domínio em **português** (`Orcamento`, `Aprovacao`, `fecharMes`), conforme os documentos; termos técnicos de infraestrutura em inglês.
- Textos visíveis ao jogador em **pt-BR**, só em `textos.pt-BR.json`.
- Funções pequenas e puras; sem estado compartilhado mutável.
- Nenhum número mágico no motor: coeficiente vem de `params`.
- Todo PR de motor traz teste; todo teste de regra cita a seção do documento de origem em comentário.
- Commits no padrão do repositório; nunca commitar segredos nem `.env`.

---

## 8. Subagentes (resumo)

Agentes em `.codex/agents/`: `motor-dev`, `data-curator`, `ui-dev`, `sim-dev`, `reviewer`. A sessão principal orquestra; um nível só. **Cada agente escreve só na sua pasta.** Fases, tabela de pastas e regras: `docs/orquestracao.md`.

**Bloqueio:** não implemente o que depende das pendências 1 e 2 (`docs/pendencias.md`) sem decisão do Lauro.
