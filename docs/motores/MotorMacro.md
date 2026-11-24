# MotorMacro

Legenda: \[CONFIRMADO\] decidido com o Lauro · \[A CONFIRMAR\] proposta ainda sem resposta · \[PENDENTE\] falta definir ou calibrar. Coeficientes são pontos de partida, a calibrar.

## 1\. Visão geral

Fecha as três variáveis macro do mês: **PIB**, **IPCA** e **dólar**. Tudo que depende do resultado do mês usa o valor do mês anterior. \[CONFIRMADO\]

## 2\. PIB \[CONFIRMADO\]

Valores iniciais: PIB 2025 \= R\$ 12,7 trilhões (≈ R\$ 1.060 bi por mês); crescimento de 2,3% em 2025\.

- **PIB real mensal** \= base de 0,19% ao mês (2,3% ao ano, com Selic em 15% como referência)  
  - **\+** soma dos impulsos (em p.p. do PIB mensal): MotorIR, MotorSubsídios (defasagem de 2 turnos), gasto público, crédito e dólar  
  - **−** freio da Selic: 0,02 p.p. ao mês para cada p.p. da Selic média dos últimos 6 meses acima de 15% (abaixo de 15% o efeito é positivo)  
- **PIB nominal** \= PIB real × nível de preços (acumula o IPCA).  
- O PIB real em 12 meses alimenta desemprego, Selic e crédito. O PIB nominal alimenta receita e dívida/PIB.

## 3\. IPCA \[CONFIRMADO\]

Valores iniciais: IPCA em 12 meses \= 4,26% (≈ 0,35% ao mês). Meta 3% com tolerância de 1,5 p.p. (teto 4,5%).

- **IPCA do mês** \= 0,90 × IPCA do mês anterior \+ 0,10 × meta mensal (0,25%) \+ impulsos (p.p. por mês):  
  - Demanda: 0,02 × (PIB 12m − 2,0)  
  - Dólar: 0,00125 × variação do dólar em 12 meses (%) (≈ 0,15 p.p. ao ano para cada 10% de desvalorização)  
  - MotorIR: impulso já calculado pelo motor (coeficiente 0,00055)  
  - MotorSubsídios: impulso de Agro e Energia  
- Saídas: IPCA em 12 meses vai para o MotorBC (Selic), MotorSocial (Índice de Miséria) e MotorOrçamento (correção do piso dos ministérios).  
- Histórico inicial de 12 meses do IPCA: aproximado por 0,35% ao mês. \[A CONFIRMAR\]

### Regimes de inflação (rótulo no painel, só o regime) \[CONFIRMADO\]

| Regime | Faixa (IPCA em 12 meses) | Significado |
| :---- | :---- | :---- |
| Deflação | abaixo de 0% | Preços caem; recessão e desemprego; dívida pesa mais em termos reais |
| Desinflação | positiva, mas em queda | Cai sem ficar negativa (esperado no começo do jogo) |
| Controlada | 0% a 4,5% | Dentro da meta com tolerância |
| Acima da meta | 4,5% a 8% | O BC aperta a Selic |
| Alta ou galopante | 8% a 50% | Dois dígitos; Índice de Miséria dispara |
| Superinflação | 50% a 100%+ ao ano | Termo informal entre galopante e hiper |
| Hiperinflação | acima de 50% ao mês | Definição clássica de Cagan |

O tipo de inflação (demanda, custos, inercial etc.) **não** é exibido; só o regime.

## 4\. Dólar \[CONFIRMADO\]

Valor inicial: **R\$ 5,49** (R\$ 5,487 no fim de 2025, queda de 11,19% no ano).

- **Dólar alvo** \= 5,49 × (1 \+ 0,05 × prêmio de risco (p.p.) \+ 0,02 × fuga de capital do MotorIR − 0,01 × (Selic − 15\) \+ 0,01 × (IPCA 12m − 4,26))  
- O dólar anda **20% da distância** até o alvo por mês.  
- Risco fiscal, fuga de capital e inflação alta desvalorizam o real; Selic alta valoriza.  
- A intervenção do BC (venda de reservas) está no MotorBC.

## 5\. Ligações com o MotorOrçamento e o dólar \[CONFIRMADO\]

1. **Gasto público → PIB**: ΔPIB (% do PIB mensal) \= m × (variação da despesa primária entre os dois meses anteriores, em R\$ bi) / 1.060 × 100, com m \= 0,5 e defasagem de 1 mês. Gastar acima do valor inicial estimula; cortar freia.  
2. **PIB → receita de consumo e empresas**: receita do mês \= valor inicial × (PIB nominal do mês anterior / PIB nominal inicial). Elasticidade 1, defasagem de 1 mês.  
3. **Dólar → PIB** (exportações): ΔPIB mensal \= 0,002 × variação do dólar em 12 meses (%), com defasagem de 3 meses (10% de desvalorização ≈ \+0,02 p.p. ao mês).

## 6\. Pendências

- Calibração de todos os coeficientes (freio da Selic, hiato, repasse cambial, multiplicador do gasto).  
- Impulso do crédito no PIB (vem do MotorBC).  
- Choques de oferta e expectativas de inflação (fora até haver eventos).  
- Série inicial de 12 meses de PIB, IPCA e dólar.