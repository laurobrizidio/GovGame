# MotorSubsídios

Legenda: \[CONFIRMADO\] decidido com o Lauro · \[A CONFIRMAR\] proposta ainda sem resposta · \[PENDENTE\] falta definir ou calibrar.

## 1\. Visão geral

- Motor fiscal de incentivos ao **setor privado**. Um turno \= 1 mês de mandato (48 turnos). \[CONFIRMADO\]  
- Seis setores: Serviços e comércio, Agro, Indústria, Energia, Moradia, Infraestrutura. \[CONFIRMADO\]  
- Dois instrumentos por setor, totalizando **12 controles** para o jogador: \[CONFIRMADO\]  
  - **Renúncia fiscal**: reduz a receita (não é despesa).  
  - **Subsídio direto**: é despesa primária.  
- Os sliders dos ministérios continuam sendo gasto direto do Estado. Os valores iniciais dos ministérios são calibrados **líquidos** de subsídios. \[CONFIRMADO\]  
- Fora do escopo por enquanto: regiões (Desenvolvimento Regional, Fundos Constitucionais) e socorro financeiro. \[CONFIRMADO\]  
- O socorro de calamidade pertence ao MotorOrçamento (inativo enquanto não houver eventos).

## 2\. Itens fixos (ficam no MotorOrçamento, sem controle do jogador)

ZFM, Desenvolvimento Regional, Fundos Constitucionais e itens sociais: IRPF (já embutido no MotorIR), entidades sem fins lucrativos, medicamentos, cesta básica, FCVS, FAT e similares. \[CONFIRMADO\]

Simples e ZFM são protegidos (ligação futura com o STF). \[CONFIRMADO\]

## 3\. Valores iniciais (R\$ bilhões por ano)

| Setor | Renúncia fiscal | Subsídio direto |
| :---- | :---- | :---- |
| Serviços e comércio | 106,6 | n/a |
| Agro | 69,4 | 16,9 |
| Indústria | ≈ 37,5 | 5,3 |
| Energia | n/a | 8,3 |
| Moradia | ≈ 21 (projeção 2026\) | 8,6 |
| Infraestrutura | parâmetro a calibrar (REIDI, debêntures) | 4,6 |
| **Total** | **≈ 235** | **≈ 44** |

- Energia e Infraestrutura começam apenas com subsídio. \[CONFIRMADO\]  
- Ordem de grandeza nacional da análise inicial: renúncias tributárias ≈ R\$ 45 bi/mês contra subsídios diretos ≈ R\$ 12 bi/mês. O jogo usa o subconjunto setorial da tabela.

## 4\. Efeitos econômicos \[CONFIRMADO\]

Para cada controle, com I\_0 \= valor inicial e I\_t \= valor escolhido no mês t:

- x \= (I\_t − I\_0) / I\_0  
- Retorno decrescente: ef(x) \= x se x ≤ 0,10 (inclui valores negativos); ef(x) \= 0,10 \+ 0,5 × (x − 0,10) se 0,10 \< x ≤ 0,20; ef(x) \= 0,15 se x \> 0,20.  
- Valor efetivo: I\_ef \= I\_0 × (1 \+ ef(x))  
- Impulso no PIB (defasagem de 2 turnos): ΔPIB\_t \= m × (I\_ef\[t−2\] − I\_ef\[t−3\]) / 1.060, expresso em % do PIB mensal (R\$ 1.060 bi) e com ΔI em R\$ bi.  
- m (multiplicador em R\$ de PIB por R\$ de incentivo): renúncia **0,14** (mesmo valor do MotorIR: 0,018 p.p. por R\$ 1 bi de consumo × propensão 0,72 ≈ 0,013 p.p. por R\$ 1 bi de alívio); subsídio **m ≤ 0,14** (a calibrar).  
- Impulso de IPCA: apenas Agro (alimentos) e Energia (preço administrado).

## 5\. Contabilidade

- A base de receita já é líquida da renúncia de 2025\. Δreceita \= −(R\_t − R\_0): aumentar a renúncia reduz a receita; reduzi-la aumenta a receita.  
- Cortar renúncia equivale a aumentar imposto: **carência de 2 turnos** (controlada pelo MotorTurno) e custo político. \[CONFIRMADO\]  
- O subsídio S\_t entra integralmente como linha de despesa primária. \[CONFIRMADO\]

## 6\. Conexões

- Envia ao MotorOrçamento: variação de receita (renúncias) e despesa (subsídios).  
- Envia ao MotorMacro: ΔPIB e impulso de IPCA (Agro e Energia).  
- Lê do MotorTurno: histórico de 3 meses de I\_ef e fila de carência. Envia ao MotorSocial o valor efetivo (I\_ef) de cada setor em relação ao valor inicial, usado nos segmentos sociais.  
- Não escreve popularidade diretamente. Eventual efeito político do corte de renúncia sai como variação de popularidade para o MotorSocial. \[A CONFIRMAR\]

## 7\. Pendências

- Multiplicador m dos subsídios (calibrar, ≤ 0,14).  
- Fator de escala de jogabilidade: renúncia de Agro \+10% rende ≈ 0,008 p.p. de PIB e todas as renúncias \+10% ≈ 0,026 p.p., efeito pequeno.  
- Valor inicial da renúncia de Infraestrutura (REIDI e debêntures).  
- Valor de Moradia (projeção 2026\) a confirmar com dados de 2025\.  
- Interface dos 12 controles e limites dos sliders.