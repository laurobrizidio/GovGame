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

Para editar os coeficientes pelo navegador e seguir jogando, rode na raiz:

```sh
pnpm dev:calibracao
```

Abra [GovGame de calibração](http://127.0.0.1:5174/) e entre na aba **Calibração**.
O [catálogo de calibração](data/2025/calibracao.json) reúne 30 coeficientes de economia, contas públicas, condições sociais e política.
Edite os valores por área ou use a busca. Clique em **Aplicar coeficientes** e volte ao jogo para confirmar o próximo mês.
Os fechamentos já confirmados permanecem no histórico com a versão usada naquele mês.
O tamanho do mandato e das janelas do histórico é fixo.

O ambiente pode rodar junto com o jogo normal. O servidor de calibração usa a porta 3002 e guarda a partida e as revisões em `.govgame/calibracao/`.

```sh
pnpm typecheck
pnpm test
pnpm lint
pnpm build
pnpm sim
```

`pnpm sim` imprime um relatório JSON com três estratégias, séries mensais, avisos e a situação dos parâmetros usados.

`pnpm sim:sensibilidade` roda a varredura dos 30 coeficientes do catálogo e gera `.govgame/sensibilidade.html`.
`pnpm sim:sensibilidade --todos` inclui os parâmetros técnicos na varredura completa.
Para gerar o ranking dos 30 coeficientes com −20% e +20% no mês 50, rode `pnpm --filter @govgame/simulador exec tsx src/ranking.ts`. O resultado fica em `relatorios/ranking-30-coeficientes.html`.
Abra o arquivo no navegador para consultar o mecanismo de cada coeficiente e comparar as trajetórias por estratégia, indicador e mês.

A aprovação começa em 55% nas cinco classes. O Risco Fiscal e a eficiência do IR após degradação da Administração aguardam definição. As contas fiscais usam os componentes calculáveis e a interface sinaliza as estimativas. Os outros canais em aberto e as propostas de calibração estão em [docs/pendencias.md](docs/pendencias.md).
