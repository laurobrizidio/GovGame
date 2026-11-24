# Orquestração (subagentes do Codex)

Agentes em `.codex/agents/`: `motor-dev`, `data-curator`, `ui-dev`, `sim-dev`, `reviewer`. A sessão principal orquestra; **um nível só** (agentes não criam agentes).

**Fases**
1. **Contrato, sem paralelismo:** `estado.ts`, `ResultadoMotor`, `params/` e `data/2025` (uma sessão só).
2. **Paralelo:** um `motor-dev` por motor, `ui-dev`, `sim-dev`.
3. **Integração:** `turno.ts`, teste de ponto fixo, depois `reviewer`.

**Cada agente escreve só na sua pasta** (conflito de arquivo = trabalho perdido):

| Agente | Escreve só em |
|---|---|
| `motor-dev` | `motores/<motor>.ts`, seu teste e suas entradas em `coeficientes.json` |
| `data-curator` | `data/2025/*`, `params/` |
| `ui-dev` | `apps/web/src/{telas,componentes,viewmodels,store}/`, `tailwind.config.ts` |
| `sim-dev` | `tools/simulador/`, `*.property.test.ts` |
| `reviewer` | nada |

**Regras:** não delegue o trecho que depende das pendências 1 e 2 de `docs/pendencias.md`; todo agente termina com `pnpm typecheck && pnpm test` e devolve relatório curto (feito, testes, pendências, divergências); faltou regra = parar e reportar, nunca inventar. O sandbox e as permissões vêm da sessão principal e valem para todos os agentes.
