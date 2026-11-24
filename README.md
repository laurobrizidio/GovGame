# GovGame

Simulador de governo por turnos para jogar no navegador do computador. O mandato começa com a base de 2025 e dura até 48 meses. O cenário permite ajustar gastos, Imposto de Renda e incentivos, conferir o resultado de cada motor e confirmar a virada de mês.

## Jogar localmente

Use Node.js 24 ou superior e pnpm. O projeto fixa a versão do pnpm no `package.json`.

```sh
pnpm install
pnpm dev
```

Abra [GovGame](http://127.0.0.1:5173/) no navegador. O Vite atende nessa porta e encaminha os saves para o Fastify em `127.0.0.1:3001`. O banco fica em `.govgame/partidas.sqlite`.

Ao fechar o mês, é possível voltar às decisões ou confirmar o resultado. O save ocorre ao confirmar. Uma amortização é aplicada uma única vez.

## Calibração

```sh
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm sim
```

`pnpm sim` imprime um relatório JSON com três estratégias, séries mensais, avisos e a situação dos parâmetros usados.

A aprovação começa em 55% nas cinco classes. O Risco Fiscal e a eficiência do IR após degradação da Administração aguardam definição. As contas fiscais usam os componentes calculáveis e a interface sinaliza as estimativas. Os outros canais em aberto e as propostas de calibração estão em [docs/pendencias.md](docs/pendencias.md).
