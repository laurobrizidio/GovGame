# MotorOrçamento

Motor responsável pelo orçamento federal do jogo: receitas, despesas, resultado primário, juros, dívida e Risco Fiscal. Cada turno corresponde a 1 mês de mandato. Base de dados: 2025\.

**Legenda de status:** \[CONFIRMADO\] \= decidido com Lauro. \[A CONFIRMAR\] \= proposta ainda não validada. \[PENDENTE\] \= falta decisão ou dado.

---

## 1\. Visão Geral

- O jogador controla o gasto de cada ministério por sliders. O motor fecha o mês: soma receitas, subtrai despesas, calcula juros e atualiza dívida e Risco Fiscal.  
- O motor **não** depende do MotorGabinete (removido do jogo). \[CONFIRMADO\]  
- O motor expõe o estado "abaixo do Piso constitucional" de cada ministério, para uso futuro por um motor do STF. Hoje não há veto: abaixo do piso só ocorre a degradação dos serviços (seção 6). \[CONFIRMADO\]

## 2\. Conexões (Entradas e Saídas)

**Entradas**

- MotorIR: arrecadação mensal do Imposto de Renda.  
- Tributos sobre consumo e empresas: receita mensal, que acompanha o PIB nominal do mês anterior (ver MotorMacro). Valor inicial (base 2025, Receita Federal): consumo R\$ 60 bi por mês (R\$ 723 bi por ano, de PIS/Cofins, IPI e IOF) e empresas R\$ 44 bi por mês (R\$ 530,8 bi por ano, de IRPJ/CSLL, o mesmo valor de 2025 citado no MotorIR). \[A CONFIRMAR: o IPI de 2025 é estimativa\]  
- MotorSubsídios: despesas com subsídios e variação de receita pelas renúncias fiscais. \[CONFIRMADO\]  
- MotorBC: taxa Selic, definida pelo BC por regra automática, com reuniões nos meses pares (ver MotorBC). \[CONFIRMADO\]

**Saídas**

- Saldo do Tesouro (Caixa do Tesouro).  
- Estoque da Dívida (% do PIB).  
- Índice de Risco Fiscal (0 a 100).  
- Nível de Qualidade dos Serviços Públicos (alimenta o MotorSocial). \[CONFIRMADO: ver seção 11\] Também envia ao MotorSocial o gasto de cada ministério em relação ao valor inicial, a nota de serviço da Saúde, o Risco Fiscal e a dívida/PIB, usados nos segmentos sociais e no Índice de Miséria.  
- Efeitos de degradação: Administração (arrecadação do MotorIR), Infraestrutura (IPCA), Educação e Saúde (PIB e manchetes).  
- Estado "abaixo do piso" por ministério (reservado ao STF futuro).

## 3\. Ordem de Execução do Turno \[CONFIRMADO\]

Regra: tudo que depende do resultado do mês usa o valor do mês anterior. Isso evita cálculo circular.

1. O MotorIR calcula a arrecadação do mês usando o nível de Administração do mês anterior.  
2. O MotorOrçamento calcula receitas, despesas, Resultado Primário e Resultado Nominal. Os juros usam o prêmio de risco do Risco Fiscal do mês anterior.  
3. No fim do turno, o jogo atualiza dívida, Risco Fiscal, degradação dos serviços e Qualidade dos Serviços Públicos. Esses valores valem no turno seguinte.

A degradação de Infraestrutura (IPCA) e de Educação e Saúde (PIB, manchetes) também aparece no turno seguinte.

## 4\. Fluxo Mensal

1. **Receitas totais** \= arrecadação do MotorIR \+ receitas de consumo e empresas.  
2. **Despesas primárias** \= soma dos sliders dos ministérios \+ subsídios \+ socorro de calamidade (quando houver).  
3. **Resultado Primário** \= Receitas − Despesas primárias.  
4. **Juros** \= estoque da dívida × taxa mensal (Selic mensal \+ prêmio de risco mensal). Ver seção 7\.  
5. **Resultado Nominal** \= Resultado Primário − Juros.  
6. Se o Nominal for negativo, o déficit soma ao estoque da dívida. Se for positivo, o superávit entra no Caixa do Tesouro (ver seção 12). \[CONFIRMADO\]

## 5\. Sliders e Retorno Decrescente

Cada ministério tem um slider com três zonas:

- **Expansão:** gasto acima do valor inicial.  
- **Ajuste normal:** entre o piso e o valor inicial.  
- **Crítica:** abaixo do Piso constitucional.

**Retorno decrescente na zona de Expansão** (sem MotorGabinete, o limite é interno ao motor). \[A CONFIRMAR: percentuais são ponto de partida\]

- Até \+10% sobre o valor inicial do ministério: efeito integral.  
- De \+10% a \+20%: efeito pela metade.  
- Acima de \+20%: sem efeito adicional, só custo. É o teto prático da zona de Expansão.

## 6\. Piso Constitucional e Degradação

O nome da regra é **Piso constitucional**. Hoje não há STF no jogo; futuramente haverá (ver seção 1). \[CONFIRMADO\]

**Como o piso é calculado** \[CONFIRMADO\]

- **Saúde e Educação:** o piso é 60% do valor inicial de 2025, corrigido pelo IPCA do próprio jogo, o mesmo valor da parte obrigatória. Decisão aceita: como o jogador só controla os 40% discricionários, o gasto nunca fica abaixo do piso, então Saúde e Educação não degradam por corte no slider. \[CONFIRMADO\] Na lei, o mínimo é 15% da Receita Corrente Líquida (Saúde) e 18% da receita líquida de impostos (Educação); o jogo usa essa regra simplificada. \[CONFIRMADO\]  
- **Demais ministérios:** o piso é 90% do valor inicial de 2025, corrigido pelo IPCA do próprio jogo. \[CONFIRMADO\]

Referência real: na Constituição, só Saúde e Educação têm piso de gasto. Mínimos de referência: Saúde R\$ 217,9 bi (2024) e R\$ 245,5 bi (2026); Educação R\$ 133,7 bi (2026). Valores de 2025: não usados; o jogo adota piso de 60% do valor inicial. Antes de 2024, sob o teto de gastos, os pisos eram corrigidos pela inflação; hoje acompanham a receita.

**Abaixo do piso (zona Crítica)**

- Administração: reduz a arrecadação do MotorIR pelo Fator de Eficiência de Arrecadação, com perda máxima de 20% (ver MotorIR, seção 3.5). \[CONFIRMADO\]  
- Infraestrutura: aumenta o IPCA.  
- Educação e Saúde: reduzem o PIB e geram manchetes negativas.  
- Inércia de recuperação: o serviço leva tempo para voltar ao normal depois que o gasto retorna ao piso.  
- Penalidade: a nota de serviço do ministério cai 2, 4 e 8 pontos por mês seguido abaixo do piso, com teto de 8 pontos por mês (ver seção 11). \[CONFIRMADO\]

## 7\. Dívida, Juros e Risco Fiscal

**Juros e prêmio de risco** \[CONFIRMADO\]

Juros do mês \= estoque da dívida × (Selic mensal \+ prêmio de risco mensal). O prêmio depende do Risco Fiscal do mês anterior, em pontos percentuais ao ano:

| Risco Fiscal | Prêmio de risco |
| :---- | :---- |
| 0 a 35 | 0 |
| 35 a 70 | sobe linearmente de 0 a 1 p.p. |
| 70 a 100 | sobe de 1 a 4 p.p. |

- Os valores são ponto de partida de balanceamento. Se ficar pesado, a saída mais simples é reduzir o teto de 4 para 2 p.p.  
- O prêmio incide sobre todo o estoque de uma vez. Na realidade só atinge os títulos que vencem e são refeitos; essa simplificação é intencional.  
- Exemplo (dívida de cerca de R\$ 10,0 tri): Risco 50 gera cerca de R\$ 3,6 bi a mais de juros por mês; Risco 85 gera cerca de R\$ 21 bi por mês.  
- Cria o efeito bola de neve: Risco alto encarece os juros, o Nominal piora, a dívida sobe e o Risco sobe. O teto do prêmio limita o ciclo.

**Fuga de capital** \[CONFIRMADO\]

A fuga de capital é calculada **somente** pelo MotorIR (alíquota da classe A). O Risco Fiscal acima de 70 não gera fuga de capital própria; seu efeito é apenas o prêmio de risco acima.

**Índice de Risco Fiscal (0 a 100\)** \[CONFIRMADO\]

- Faixas de referência: 35 e 70\.  
- É calculado sobre o **Primário ajustado** (sem o socorro de calamidade) e sobre a dívida.  
- **Não** existe penalidade extra por corte de imposto sem compensação. O corte de imposto já é punido pelo déficit que gera.  
- Pesos de cada fator: Primário ajustado 40%, estoque da dívida/PIB 40% e juros 20%. \[CONFIRMADO: calibrar jogando\]

**Mecânicas simples de dívida** \[A CONFIRMAR\]

- **Caixa do Tesouro:** saldo disponível do governo, com saldo inicial de R\$ 1,19 tri (reserva de liquidez de dezembro de 2025). \[CONFIRMADO\]  
- **Rolagem com prêmio de risco:** a dívida que vence é refeita pelo custo do momento (já coberto pelo prêmio acima).  
- **Amortização extraordinária:** botão do jogador para pagar parte da dívida com o Caixa, usando só o que passar de R\$ 1,0 tri (mínimo de segurança). \[CONFIRMADO\]  
- **Crise de rolagem:** começa com Risco Fiscal de 90 ou mais e termina abaixo de 80 (ver seção 12). \[CONFIRMADO\]

## 8\. Socorro de Calamidade \[CONFIRMADO, exceto o gatilho\]

Existe um único tipo de socorro: o socorro de calamidade (o socorro financeiro foi incorporado a ele).

- **Resultado Primário:** o socorro entra como despesa primária. O Termômetro do Primário mostra o déficit real.  
- **Risco Fiscal:** não considera o socorro (usa o Primário ajustado).  
- **Dívida:** o déficit entra no Resultado Nominal e soma ao estoque, sem regra extra.  
- **Gatilho** \[A CONFIRMAR\]: o socorro só pode ser liberado enquanto houver um evento de calamidade ativo (enchente, seca, crise bancária etc.), com teto no valor do evento. Fora disso, o gasto extra vai pelos sliders dos ministérios e pesa normalmente no Risco Fiscal. Isso evita que o jogador esconda gasto classificando-o como calamidade.

Referência real: no caso do Rio Grande do Sul (2024), as despesas de calamidade foram autorizadas por crédito extraordinário e excluídas da meta fiscal e do limite de gastos, mas continuaram sendo gasto e aumentaram a dívida.

## 9\. Interface

- Termômetro do Primário (mostra o resultado real, com o socorro de calamidade).  
- Fatura de Juros.  
- Projeção Dívida/PIB.  
- Índice de Risco Fiscal.  
- Sliders de três zonas por ministério.

## 10\. Ministérios e Despesas (Valores Iniciais de 2025\)

O jogo tem 15 ministérios com slider, agrupados por afinidade a partir das 38 pastas de 2025, mais a Previdência como gasto fixo. Os valores vêm do PLOA 2025 (total) e da dotação discricionária de novembro de 2025\. \[CONFIRMADO\]

* **Previdência:** gasto recorrente fixo de R\$ 1,03 tri por ano (cerca de R\$ 85,6 bi por mês), sem slider e sem piso. Sobe todo mês com o IPCA do jogo. \[CONFIRMADO\]  
* **Saúde e Educação:** 60% do total é despesa obrigatória e 40% é discricionária. O jogador só mexe nos 40%. \[CONFIRMADO\] A parte obrigatória cresce todo mês com o IPCA do jogo. \[CONFIRMADO\]  
* **Demais 13 ministérios:** o slider mexe no total da verba, sem separação entre obrigatória e discricionária. \[CONFIRMADO\] Presidência: R\$ 2,57 bi por ano entram em Administração e Governo como parcela fixa, sem slider, corrigida pelo IPCA; o slider mexe só nos outros R\$ 4,67 bi. \[CONFIRMADO\]  
* **Piso dos demais ministérios:** 90% do valor inicial, corrigido pelo IPCA, igual para todos. \[CONFIRMADO\] Saúde e Educação: piso de 60% do valor inicial, corrigido pelo IPCA (seção 6).

Valores iniciais por ministério (R\$ bilhões por ano):

| Ministério | Pastas de 2025 incluídas | Valor inicial (R\$ bi/ano) |
| :---- | :---- | :---- |
| Saúde | Saúde | 241,61 (obrigatória 144,97; discricionária 96,64) |
| Educação | Educação | 200,49 (obrigatória 120,29; discricionária 80,20) |
| Ciência e Tecnologia | Ciência, Tecnologia e Inovação | 16,68 |
| Cultura e Esportes | Cultura; Esportes | 6,62 |
| Trabalho | Trabalho e Emprego | 121,51 |
| Assistência Social e Cidadania | Desenvolvimento e Assistência Social; Direitos Humanos; Mulheres; Igualdade Racial; Povos Indígenas | 293,60 |
| Infraestrutura e Cidades | Transportes; Portos e Aeroportos; Minas e Energia; Comunicações; Cidades; Integração e Desenvolvimento Regional | 74,04 |
| Agropecuária | Agricultura; Desenvolvimento Agrário; Pesca e Aquicultura | 16,84 |
| Meio Ambiente | Meio Ambiente | 4,13 |
| Indústria, Comércio e Turismo | Indústria e Comércio; Empreendedorismo; Turismo | 5,55 |
| Fazenda e Planejamento | Fazenda; Planejamento e Orçamento | 30,95 |
| Administração e Governo | Gestão e Inovação; Casa Civil; Relações Institucionais; Secretaria-Geral; Secom; Presidência (parcela fixa) | 7,24 (inclui Presidência: 2,57, fixa) |
| Defesa | Defesa; Gabinete de Segurança Institucional | 133,58 |
| Relações Exteriores | Relações Exteriores | 5,09 |
| Justiça e Controle | Justiça e Segurança Pública; Advocacia-Geral da União; Controladoria-Geral da União | 28,09 |

Soma dos 15 ministérios: cerca de R\$ 1.186 bi por ano, já com a Presidência. Com a Previdência, cerca de R\$ 2.213 bi por ano (R\$ 184 bi por mês). Não inclui dívida nem encargos.

## 11\. Qualidade dos Serviços Públicos

A Qualidade dos Serviços Públicos é uma nota de 0 a 100 que mede se o Estado entrega o que prometeu. Ela alimenta o MotorSocial. \[CONFIRMADO\]

* **Nota por ministério:** cada ministério com piso tem a sua nota de serviço, que começa em 100\.  
* **Recuperação:** no piso ou acima, a nota sobe 5 pontos por mês, até voltar a 100\.  
* **Queda:** abaixo do piso, a nota cai com penalidade que dobra a cada mês seguido: 2, 4 e 8 pontos, com teto de 8 pontos por mês.  
* **Qualidade geral:** média das notas dos ministérios com piso, com pesos iguais por enquanto.  
* **Efeito na popularidade:** variação mensal \= 0,03 × (Qualidade − 100). Com Qualidade 70, a aprovação perde cerca de 0,9 ponto por mês. O coeficiente é ponto de partida, a calibrar.  
* **Efeitos específicos:** continuam como na seção 6: Administração (arrecadação do IR), Infraestrutura (IPCA), Educação e Saúde (PIB e manchetes).

## 12\. Caixa do Tesouro, Crise de Rolagem e Calote

Regras do Caixa, da amortização, da crise de rolagem e do calote fiscal. \[CONFIRMADO\]

* **Caixa inicial:** R\$ 1,19 tri, a reserva de liquidez da dívida em dezembro de 2025\. O Caixa não rende juros. A dívida inicial é de R\$ 10,0 tri (78,7% do PIB de R\$ 12,7 tri), a dívida bruta do governo geral de dezembro de 2025\.  
* **Superávit e déficit:** o superávit soma ao Caixa. O déficit soma direto à dívida, sem consumir o Caixa.  
* **Amortização extraordinária:** o jogador só pode usar o que passar do mínimo de segurança de R\$ 1,0 tri.  
* **Crise de rolagem:** começa quando o Risco Fiscal chega a 90 ou mais e termina quando cai abaixo de 80\.  
* **Efeitos da crise:** o Tesouro paga os vencimentos com o Caixa. Saem cerca de R\$ 163 bi por mês do Caixa, abatendo a dívida (o Caixa inicial cobre 7,3 meses de vencimentos). A popularidade perde 1 ponto por mês e as manchetes ficam negativas.  
* **Calote fiscal (fim de jogo):** acontece pelo que vier primeiro: Risco Fiscal em 100 por 3 meses seguidos, ou Caixa zerado durante a crise de rolagem.

## 13\. Pendências

**Dados a levantar (orçamento de 2025\)**

- Resolvido: piso dos demais ministérios em 90% do valor inicial, corrigido pelo IPCA (seções 6 e 10).  
- Resolvido: piso de Saúde e Educação em 60% do valor inicial (seções 6 e 10).  
- Resolvido: dívida inicial (R\$ 10,0 tri) e receitas iniciais de consumo e empresas; PIB anual de referência de R\$ 12,7 tri.

**Decisões em aberto**

- Resolvido: pesos do Risco Fiscal em 40% / 40% / 20% (calibrar).  
- Resolvido: Qualidade dos Serviços Públicos e ligação com a popularidade (seção 11).  
- Resolvido: impeachment com aprovação geral abaixo de 15% por 3 meses seguidos (MotorTurno, seção 4).  
- Resolvido: penalidade abaixo do piso entra na nota de serviço do ministério (seções 6 e 11).  
- Selic: decidida pelo BC por regra automática, com conversão para taxa mensal definida no MotorBC. \[CONFIRMADO\]  
- Reuniões da Selic nos meses pares, o que resolve a divergência com o turno mensal. \[CONFIRMADO\]  
- Resolvido: destino do superávit, crise de rolagem e calote (seção 12).

---

*Registrado a partir da análise do texto base (Gemini) e das decisões tomadas nesta conversa. Este arquivo pode ser editado livremente.*