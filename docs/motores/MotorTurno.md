# MotorTurno

Legenda: \[CONFIRMADO\] decidido com o Lauro · \[A CONFIRMAR\] proposta ainda sem resposta · \[PENDENTE\] falta definir ou calibrar.

## 1\. Visão geral

Orquestrador da simulação. Um turno \= 1 mês de mandato, **48 turnos**. Executa os motores em ordem, guarda o histórico e verifica as condições de fim de jogo. Não existe MotorGabinete nem MotorEventos por enquanto. \[CONFIRMADO\]

## 2\. Ordem de execução do mês \[CONFIRMADO\]

1. MotorIR  
2. MotorSubsídios  
3. MotorOrçamento  
4. MotorBC (reunião da Selic só nos meses pares)  
5. MotorMacro  
6. MotorSocial  
7. Fim de turno: atualiza dívida, Caixa, Risco Fiscal, crise de rolagem, degradação e Qualidade dos Serviços para o mês seguinte e grava o histórico.

Regra geral: tudo que depende do resultado do mês usa o valor do mês anterior (por exemplo, o MotorIR usa o nível de Administração do mês anterior e o MotorOrçamento usa o prêmio de risco do mês anterior).

## 3\. O que o MotorTurno guarda \[CONFIRMADO\]

- 12 meses de: Selic, PIB, IPCA, dólar e inadimplência.  
- 3 meses do nível efetivo (I\_ef) de subsídios e renúncias.  
- Fila de **carência de 2 turnos** para mudanças de imposto e corte de renúncia.  
- Selic inicial do histórico: 15%.  
- Contagem de meses seguidos com Risco Fiscal em 100 e estado da crise de rolagem (ativa ou não).

## 4\. Fim de jogo \[A CONFIRMAR: limites numéricos\]

- **Impeachment**: aprovação geral abaixo de 15% por 3 meses seguidos. \[CONFIRMADO: 15%\]  
- **Calote fiscal:** acontece pelo que vier primeiro entre Risco Fiscal em 100 por 3 meses seguidos e Caixa do Tesouro zerado durante a crise de rolagem. \[CONFIRMADO\]  
- **Crise de rolagem (não é fim de jogo):** começa com Risco Fiscal de 90 ou mais e termina abaixo de 80\. Durante a crise o Tesouro paga os vencimentos com o Caixa, a popularidade perde 1 ponto por mês e as manchetes ficam negativas. \[CONFIRMADO\]  
- **Hiperinflação**: IPCA mensal acima de 50% (definição de Cagan) por 3 meses seguidos. \[CONFIRMADO: gatilho pela definição de Cagan\]  
- **Fim normal**: 48 meses completos, com resultado final.

Os limites numéricos são pontos de partida, a calibrar.

## 5\. Painel

Exibe o **regime de inflação** do mês (só o regime; sem tipo de inflação) pela faixa do IPCA em 12 meses. Ver tabela em MotorMacro. \[CONFIRMADO\]

## 6\. Conexões

- Dispara cada motor na ordem acima e repassa os valores do mês anterior.  
- Recebe a aprovação final do MotorSocial para checar o impeachment.  
- Recebe Risco Fiscal, dívida e Caixa do Tesouro do MotorOrçamento para checar a crise de rolagem e o calote.  
- Recebe IPCA do MotorMacro para checar a hiperinflação.

## 7\. Pontuação Final do Mandato \[CONFIRMADO\]

A pontuação é uma nota de 0 a 100 calculada no fim dos 48 meses, com seis componentes. Cada componente vai de 0 a 100 em linha reta entre o valor pior e o melhor, e a nota final é a soma ponderada pelos pesos.  
Componentes, pesos e faixas:

| Componente | Peso | 100 pontos | 0 pontos |
| :---- | :---- | :---- | :---- |
| Aprovação média dos últimos 12 meses | 30% | 70% ou mais | 15% ou menos |
| Dívida/PIB final | 20% | 70% ou menos | 100% ou mais |
| Qualidade dos Serviços média | 15% | nota 100 | nota 0 |
| Crescimento médio do PIB | 15% | 4% ao ano ou mais | −2% ao ano ou menos |
| IPCA médio | 10% | 3,0% ou menos | 10% ou mais |
| Desemprego final | 10% | 4,0% ou menos | 10% ou mais |

Fórmula: quando maior é melhor (aprovação, Qualidade e PIB), nota \= 100 × (valor − pior) ÷ (melhor − pior). Quando menor é melhor (dívida/PIB, IPCA e desemprego), nota \= 100 × (pior − valor) ÷ (pior − melhor). A nota de cada componente fica limitada entre 0 e 100\. Exemplo no início do jogo: dívida/PIB de 78,7% dá 71 pontos; IPCA de 4,26% dá 82; desemprego de 5,6% dá 73\.  
Valores usados: aprovação \= média dos últimos 12 meses; Qualidade \= média mensal da Qualidade dos Serviços no mandato; PIB \= crescimento médio anual do mandato; IPCA \= média do IPCA em 12 meses ao longo do mandato; desemprego e dívida/PIB \= valores do último mês.  
Fim antecipado: impeachment, calote fiscal ou hiperinflação encerram o jogo, e a nota calculada naquele momento é multiplicada por (meses cumpridos ÷ 48). \[CONFIRMADO\]

## 8\. Pendências

- Resolvido: consequências da crise de rolagem e do calote fiscal (ver MotorOrçamento, seção 12).  
- Resolvido: pontuação final do mandato (seção 7).  
- Calibração dos limites de fim de jogo.  
- Eventos (calamidades, escândalos): fora por ora; quando voltarem, definir dono.