# MotorBC

Legenda: \[CONFIRMADO\] decidido com o Lauro · \[A CONFIRMAR\] proposta ainda sem resposta · \[PENDENTE\] falta definir ou calibrar. Coeficientes são pontos de partida, a calibrar jogando.

## 1\. Visão geral

O BC é independente e age por **regra automática**; o jogador não controla a Selic, mas a influencia pela inflação, pelo PIB e pelo Risco Fiscal. \[CONFIRMADO\]

Blocos ativos: (1) Selic, (2) crédito e inadimplência, (3) intervenção cambial e reservas. \[CONFIRMADO\]

Fixos ou só indicadores: compulsório, tarifas, teto do rotativo, Pix e cartões. \[CONFIRMADO\]

## 2\. Selic

- Valor inicial: **15,0%** (mantida desde junho de 2025). \[CONFIRMADO\]  
- Reuniões nos **meses pares**. Movimento em múltiplos de **0,25 p.p.**, máximo de **1 p.p.** por reunião. \[CONFIRMADO\]  
- **Selic alvo** \= 15,0 \+ 1,5 × (IPCA 12m − 4,26) \+ 0,5 × (PIB 12m − 2,0) \+ 0,5 × prêmio de risco (p.p. ao ano). \[CONFIRMADO\]  
- Movimento \= metade da distância até o alvo, arredondada a 0,25 p.p., limitada a ±1 p.p. \[CONFIRMADO\]  
- Limites da Selic: **−5% a 30%** (definido pelo Lauro). \[CONFIRMADO\]  
- Com os dados de 2025 o alvo dá 15%: o BC mantém a taxa até algo mudar.  
- Selic mensal \= (1 \+ Selic anual)^(1/12) − 1 (≈ 1,17% ao mês com 15%). \[CONFIRMADO\]

## 3\. Custo da dívida \[CONFIRMADO\]

- Custo da dívida \= média móvel de 12 meses da Selic \+ prêmio de risco do mês anterior, com **piso de 0%**.  
- Uma alta da Selic pesa nos juros aos poucos (rolagem gradual).  
- O MotorTurno guarda 12 meses de histórico da Selic, partindo de 15%.

## 4\. Crédito e inadimplência \[CONFIRMADO\]

Valores iniciais: saldo do crédito SFN ≈ R\$ 7,1 trilhões, crescimento de ≈ 10,3% em 12 meses; inadimplência total 4,1% (famílias 5%, empresas 2,5%); juros médios às famílias 60,1% ao ano; endividamento das famílias 49,7% da renda e comprometimento 29,2%.

- **Crescimento do crédito (12m, nominal)** \= 10,3 − 0,6 × (Selic de 3 meses atrás − 15\) \+ 1,0 × (PIB 12m − 2,0) − 1,0 × (inadimplência − 4,1)  
- **Inadimplência alvo** \= 4,1 \+ 0,10 × (Selic média dos últimos 9 meses − 15\) \+ 0,25 × (desemprego − 5,6)  
- A inadimplência se aproxima do alvo **10% da distância por mês** (reproduz a defasagem de ≈ 9 meses da Selic).  
- Se a inadimplência passar de **6%**, o crédito entra em aperto: o crescimento cai pela metade.  
- As constantes são calibradas para o jogo começar em 10,3% de crescimento e 4,1% de inadimplência.  
- Ligações: o crescimento do crédito vira pequeno ΔPIB no MotorMacro (coeficiente \[PENDENTE\]); a inadimplência alimenta o segmento Famílias endividadas no MotorSocial.

## 5\. Intervenção cambial e reservas \[CONFIRMADO\]

O dólar é calculado no MotorMacro; o MotorBC só intervém.

- Reservas iniciais: **US\$ 358,23 bilhões** (dezembro de 2025).  
- Se o dólar subir mais de **3% em um mês**, o BC vende reservas automaticamente. Cada US\$ 10 bi vendidos seguram 1% de alta, com limite de **10% das reservas por mês**.  
- Reservas paradas rendem **0,3% ao mês**.  
- Reservas abaixo de **US\$ 200 bi** somam **\+1 p.p.** ao prêmio de risco.

## 6\. Itens fixos e indicadores \[CONFIRMADO\]

| Item | Tratamento |
| :---- | :---- |
| Pix | Indicador; cresce com o consumo do mês anterior; inicial: R\$ 35,36 tri e ≈ 79,8 bi de transações em 2025 |
| Cartões | Indicador; inicial: R\$ 4,5 tri e 48,1 bi de transações em 2025 |
| Compulsório | Parâmetro fixo (à vista 21%; demais alíquotas a confirmar); pode virar gatilho automático em crise de crédito |
| Teto do rotativo e tarifas | Regras fixas, sem simulação |

## 7\. Conexões

- Recebe: IPCA 12m, PIB 12m, desemprego, prêmio de risco (MotorOrçamento), variação do dólar (MotorMacro).  
- Envia: Selic (MotorOrçamento e MotorMacro), crédito (ΔPIB para o MotorMacro), inadimplência (MotorSocial), venda de reservas e nível de reservas (prêmio de risco).  
- O MotorTurno guarda o histórico de Selic (12 meses), inadimplência e crédito.

## 8\. Pendências

- Coeficiente do impulso do crédito no PIB.  
- Alíquotas de compulsório além da à vista.  
- Calibração de todos os coeficientes; relação entre prêmio de risco e reservas.