# Motor (`packages/engine`)

Regras desta pasta. Resumo dos motores: `docs/motores-resumo.md`. Regras exatas: `docs/motores/*.md`.

## Princípios

1. **Funções puras.** Cada motor recebe o estado anterior imutável, as saídas dos motores que já rodaram no mês, as decisões e os parâmetros, e devolve as saídas do mês. Nada de estado global, relógio ou aleatoriedade.
2. **Pipeline fixo, definido pelo MotorTurno:**
   1. MotorIR
   2. MotorSubsídios
   3. MotorOrçamento
   4. MotorBC (reunião da Selic só nos **meses pares**)
   5. MotorMacro
   6. MotorSocial
   7. Fim de turno: atualiza dívida, Caixa, Risco Fiscal, crise de rolagem, degradação dos serviços e Qualidade dos Serviços para o mês seguinte; grava o histórico; confere o fim de jogo.
3. **Regra anti-circularidade:** tudo que depende do resultado do mês usa o **valor do mês anterior** (por exemplo: o MotorIR usa a Administração do mês anterior; o MotorOrçamento usa o prêmio de risco do mês anterior; a receita de consumo e empresas segue o PIB nominal do mês anterior). Tipar as entradas de cada motor de modo que ele só enxergue saídas de quem já rodou.
4. **Estado imutável e explícito.** Nada fica escondido em closures.
5. **Dados fora do código** (`data/AGENTS.md`).
6. **Determinismo.** Sem eventos nem aleatoriedade hoje. Se um dia houver, use PRNG com seed guardada no save.
7. **Partida reproduzível:** estado inicial + versão dos parâmetros + lista de decisões reproduzem a partida inteira.

## API pública do motor

```ts
fecharMes(estado, decisoes, params): ResultadoDoMes
//  → { proximoEstado, trace: ResultadoMotor[], deltas, manchetes, avisos, fimDeJogo? }
//  Não altera `estado`. O commit é decisão da camada acima.

preview(estado, rascunho, params): PreviewFiscal
//  Só IR + Subsídios + Orçamento. Alimenta a "Projeção do mês" (Nominal), os totais
//  de Gastos/Receitas e a amortização, enquanto o jogador mexe nos sliders.

projetar(estado, decisoes, meses, params): Projecao
//  Roda o pipeline N meses repetindo as decisões. Ex.: "Projeção da dívida/PIB se nada mudar".

agenda(estado, params): ItemAgenda[]
//  Efeitos agendados: reunião do BC (e movimento previsto), carência de IR/renúncia
//  (2 turnos), defasagens de PIB. Alimenta "Próximos meses" no Painel.
```

## Formato de resultado de cada motor

```ts
type ResultadoMotor<S> = {
  saidas: S;
  impulsos: { fonte: string; valor: number }[];                 // p.p. do PIB mensal, IPCA etc.
  popularidade: { origem: string; delta: number; rotulo: string }[];
  avisos: { codigo: string; params: Record<string, number | string> }[];
};
```

- **Popularidade:** cada motor devolve apenas **variações**. A simulação central soma e limita entre 0 e 100. **O MotorSocial é o único que escreve Aprovação e Desemprego.**
- A decomposição em `impulsos` e `popularidade` alimenta as telas (impulsos do PIB, "por que a aprovação caiu", passo a passo do Fechamento) sem recalcular nada na UI.
- O motor emite **código + parâmetros**; a UI monta a frase com os textos em `data/2025/textos.pt-BR.json`.

## Estado (o que o MotorTurno guarda)

- Históricos de **12 meses**: Selic (partindo de 15%), PIB, IPCA, dólar, inadimplência, crédito.
- **3 meses** do nível efetivo `I_ef` de subsídios e renúncias.
- **Fila de carência de 2 turnos** para aumento de imposto e corte de renúncia.
- Dívida, Caixa, Risco Fiscal; contagem de meses com Risco Fiscal em 100; estado da crise de rolagem.
- Aprovação por classe (E, D, C, B, A); satisfação dos 20 segmentos; pressões ativas (com histerese, ver `docs/pendencias.md`).
- Notas de serviço por ministério com piso e meses seguidos abaixo do piso.
- Contagem de meses seguidos com aprovação geral abaixo de 15%.
- Reservas internacionais.

## Transação de fechamento (comportamento da UI)

1. O jogador ajusta o **rascunho de decisões**; `preview()` atualiza a barra de projeção.
2. **Fechar mês** → `fecharMes()` produz o `resultadoPendente` (não grava nada).
3. Tela Fechamento: **Rever decisões** descarta o resultado e volta ao mês com as decisões mantidas; **Começar o mês N+1** confirma (commit + save em SQLite).
4. O save só acontece no commit.

## Testes de motor (Vitest)

- Estado inicial sem mudanças deve ficar estável: Selic em 15%, alvo da Selic = 15%, arrecadação do IR ≈ R$ 35 bi/mês, IPCA em torno de 4,26%.
- Os exemplos numéricos dos documentos viram testes dourados (por exemplo: dívida de ≈ R$ 10,0 tri com Risco 50 gera ≈ R$ 3,6 bi a mais de juros por mês; Risco 85, ≈ R$ 21 bi).
- Propriedades (fast-check): popularidade sempre entre 0 e 100; Caixa nunca negativo fora de calote; nenhuma função usa saída de motor que ainda não rodou.
