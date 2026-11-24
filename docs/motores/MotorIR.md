# MotorIR — Especificação do Motor de Simulação do Imposto de Renda

## 1\. Visão Geral e Objetivo

O **MotorIR** é o subsistema econômico e político responsável por calcular os efeitos da tributação direta sobre a renda dentro do simulador de governo **GovGame**. A cada turno (equivalente a um mês de mandato), o motor avalia as alíquotas definidas pelo Presidente para cada faixa socioeconômica da população e determina o impacto resultante na arrecadação do Tesouro Nacional, no consumo interno, no crescimento do Produto Interno Bruto (PIB), na pressão inflacionária, na fuga de capitais e na popularidade geral do governo.

Nesta versão do projeto, o sistema opera de forma direta entre as decisões do Executivo e a reação da economia e da opinião pública, sem depender de votações ou articulação no Congresso Nacional.

---

## 2\. Segmentação das Classes Sociais (Parâmetros Base)

A população do país é dividida em cinco classes econômicas (**Classe E, Classe D, Classe C, Classe B e Classe A**). Cada grupo possui participação distinta na demografia nacional, na massa salarial tributável e no comportamento de consumo:

| Classe Social | Perfil Econômico | População (%) | Base Tributável Mensal | Alíquota Inicial de Referência | Propensão ao Consumo |
| :---- | :---- | :---: | :---: | :---: | :---: |
| **Classe E** | Base da pirâmide, trabalhadores informais e população vulnerável | 22,3% | R\$ 9 bilhões | 0,0% | 95% |
| **Classe D** | Trabalhadores formais de baixa renda e salário mínimo | 27,1% | R\$ 24 bilhões | 7,5% | 90% |
| **Classe C** | Classe média baixa, principal motor do varejo e serviços | 31,7% | R\$ 54 bilhões | 15,0% | 85% |
| **Classe B** | Classe média alta, profissionais liberais e gestores | 15,0% | R\$ 58 bilhões | 22,5% | 70% |
| **Classe A** | Alta renda, grandes empresários, rentistas e investidores | 3,9% | R\$ 44 bilhões | 27,5% | 45% |

### Significado dos Parâmetros

* **Base Tributável Mensal:** Representa a parcela da renda mensal de cada faixa efetivamente sujeita ao imposto, após isenções, deduções e rendimentos não tributáveis (calibração na seção 6).  
* **Alíquota Inicial de Referência:** É o ponto de equilíbrio histórico do início do mandato. Alterações acima ou abaixo desse patamar geram reações econômicas e políticas proporcionais à variação aplicada.  
* **Propensão Marginal ao Consumo:** Indica qual percentual da renda livre cada classe transforma imediatamente em compras de bens e serviços. Enquanto a Classe E gasta praticamente toda renda extra em itens essenciais, a Classe A direciona a maior parte de seus recursos para poupança e aplicações financeiras.

---

## 3\. Regras de Cálculo Econômico (Fluxo Mensal)

A cada virada de mês, o MotorIR executa quatro etapas sequenciais para apurar os resultados macroeconômicos:

### 3.1. Arrecadação Efetiva e Curva de Laffer (Efeito Evasão)

A receita bruta de cada classe corresponde à sua base tributável mensal multiplicada pela alíquota definida pelo jogador. Entretanto, o motor aplica o princípio econômico da **Curva de Laffer**:

* **Zona de Eficiência Normal (até 30%):** Qualquer alíquota igual ou inferior a 30% é arrecadada integralmente, sem perdas por evasão.  
* **Zona de Evasão e Elisão Fiscal (acima de 30%):** Sempre que o jogador eleva a alíquota de qualquer classe acima de 30%, inicia-se um processo de sonegação, planejamento tributário agressivo e informalidade. Para cada ponto percentual acima de 30%, a eficiência da coleta cai em 1,8%, respeitando um piso mínimo de 50% de aproveitamento. Dessa forma, aumentos excessivos acabam reduzindo a receita real do Estado.

### 3.2. Renda Disponível, Consumo e Impacto no PIB

Quando o jogador reduz a alíquota de uma classe abaixo da referência inicial, sobra mais dinheiro no bolso do cidadão (aumento da renda disponível). Quando aumenta a alíquota, a renda disponível encolhe.

* O MotorIR multiplica a variação da renda disponível de cada classe pela sua respectiva **propensão ao consumo**.  
* A soma das variações de consumo das cinco classes define o impulso na atividade econômica: cada **R\$ 1 bilhão** adicional de consumo mensal gera **\+0,018 ponto percentual** no crescimento mensal do PIB.

### 3.3. Pressão Inflacionária de Demanda

O aquecimento acelerado do consumo pressiona a oferta de produtos e serviços na economia:

* Sempre que o saldo líquido de variação do consumo for positivo (expansão do consumo acima do equilíbrio), cada **R\$ 1 bilhão** adicional acrescenta **\+0,00055 ponto percentual** à inflação mensal (IPCA).  
* Caso a variação líquida de consumo seja negativa (contração econômica por aumento de impostos), este canal não gera deflação automática, mantendo impacto inflacionário neutro.

### 3.4. Fuga de Capital e Risco Externo (Classe A)

A Classe A concentra os detentores de capital produtivo e financeiro do país:

* Sempre que a alíquota da Classe A for elevada acima da referência inicial de 27,5%, o MotorIR registra saída de investimentos e pressão sobre o câmbio.  
* Para cada ponto percentual acima de 27,5%, adiciona-se **1,0 ponto** ao **Índice de Fuga de Capital**, aumentando a vulnerabilidade externa e pressionando a cotação do dólar nos demais módulos do jogo.

### 3.5. Fator de Eficiência de Arrecadação

A qualidade da Administração pública afeta a capacidade de cobrar o imposto devido, com efeito direto sobre a arrecadação do MotorIR:

* Quando o gasto do ministério da Administração fica abaixo do Piso constitucional, o MotorOrçamento registra a degradação do serviço e o MotorIR aplica um **Fator de Eficiência de Arrecadação** sobre a arrecadação total do mês, calculada depois da Curva de Laffer.  
* O fator vai de 100% (sem perda, com a Administração no piso ou acima) até 80%, ou seja, uma **perda máxima de 20%**, o equivalente a cerca de R\$ 7 bi por mês sobre a arrecadação inicial de aproximadamente R\$ 35 bi.  
* O MotorIR usa o nível de Administração do mês anterior, o que evita cálculo circular. Depois que o gasto volta ao piso, o fator se recupera de forma gradual, conforme a inércia de recuperação definida no MotorOrçamento.  
* O fator vale somente para o Imposto de Renda. A receita de consumo e empresas continua seguindo o PIB nominal.

---

## 4\. Regras de Impacto Político e Justiça Tributária

Além dos efeitos financeiros, a tabela do Imposto de Renda molda diretamente a aprovação do Presidente perante a sociedade:

### 4.1. Satisfação Direta por Faixa de Renda

Cada classe reage individualmente às mudanças na sua própria alíquota, ponderada pelo seu peso na população total:

* **Classes de Base (Classes E e D):** Possuem alta sensibilidade política (fator multiplicador de **150 pontos** por ponto percentual alterado), pois qualquer aumento ou alívio tributário afeta diretamente o custo de alimentação e sobrevivência básica.  
* **Classes Média e Alta (Classes C, B e A):** Possuem sensibilidade política moderada (fator multiplicador de **85 pontos** por ponto percentual alterado).

### 4.2. Regra de Justiça Tributária (Penalidade por Regressividade)

O MotorIR avalia o senso coletivo de justiça social comparando a carga tributária cobrada no topo da pirâmide com a carga cobrada na base:

* **Índice de Progressividade:** É calculado pela diferença entre a alíquota da **Classe A** e a média das alíquotas das **Classes D e E**. No início do jogo, essa distância de equilíbrio é de **23,75 pontos percentuais**.  
* **Gatilho de Indignação Popular:** Se o jogador reduzir o imposto dos mais ricos (Classe A) enquanto mantém ou eleva o imposto dos mais pobres (Classes D e E), a distância entre topo e base diminui, tornando o sistema mais regressivo.  
* **Penalidade Aplicada:** Para cada ponto percentual de redução nessa distância em relação ao equilíbrio inicial, o motor aplica uma penalidade severa de **\-1,3 ponto diretamente na Popularidade Geral**, refletindo protestos e desgaste de imagem por favorecimento aos mais ricos, além de habilitar manchetes negativas na imprensa.  
* **Estratégia de Equilíbrio:** Para desonerar a Classe A sem sofrer desgaste de imagem, o jogador deve realizar um pacote equilibrado, reduzindo proporcionalmente a carga tributária das classes de base.

---

## 5\. Dinâmica Temporal e Integração com o Jogo

* **Carência de Vigência (Anterioridade):** Aumentos de alíquota levam **2 turnos (2 meses)** para passar a gerar aumento real de arrecadação no caixa do Tesouro, mas o desgaste na popularidade ocorre imediatamente no mês do anúncio. Reduções de imposto têm efeito imediato no consumo e na aprovação.  
* **Entradas do MotorIR:** Recebe mensalmente as alíquotas vigentes das cinco classes (A, B, C, D e E) e o índice atual de popularidade do governo. Recebe também o nível de Administração do mês anterior, que define o Fator de Eficiência de Arrecadação.  
* **Saídas do MotorIR:** Entrega ao núcleo central da simulação a Arrecadação Mensal (em R\$ bilhões), a Variação do PIB (%), a Variação da Inflação (%), a Penalidade de Injustiça Tributária, a Popularidade Geral Atualizada (%), o Índice de Fuga de Capital e as alíquotas vigentes das cinco classes (lidas pelo MotorSocial no Índice de Miséria e nos segmentos sociais).

## 6\. Calibração com Dados de 2025

Os parâmetros da seção 2 foram atualizados com dados de 2025\. As alíquotas de referência coincidem com a tabela progressiva do IRPF vigente em 2025 (0%, 7,5%, 15%, 22,5% e 27,5%), portanto os gatilhos das seções 3 e 4 permanecem inalterados.

* **População (%):** distribuição por classe estimada pela Tendências Consultoria para 2025\. As classes D e E somam 49,4%, a C tem 31,7%, a A tem 3,9% e a B 15,0% (por diferença). A divisão entre D e E (27,1% e 22,3%) é uma suposição que mantém a proporção do documento anterior.  
* **Base Tributável Mensal:** a renda de cada classe foi estimada a partir da PNAD Contínua do IBGE (em 2025, os 10% mais ricos concentram 40,3% da massa de rendimentos) e aplicada ao PIB de 2025, de R\$ 12,7 trilhões (cerca de R\$ 1,06 trilhão por mês). Sobre essa renda aplicou-se um fator de 18%, escolhido para que a arrecadação inicial seja de cerca de R\$ 35 bilhões por mês, o equivalente ao IRRF de 2025 (R\$ 421,8 bilhões por ano).  
* **IRRF de 2025 usado como referência:** rendimentos do trabalho R\$ 235,4 bilhões, rendimentos de capital R\$ 162,6 bilhões e outros rendimentos R\$ 23,8 bilhões, segundo a Receita Federal.  
* **Fora do escopo do MotorIR:** o IRPF da declaração de ajuste e do carnê-leão (valor anual de 2025 não localizado), o IRPJ/CSLL (R\$ 530,8 bilhões em 2025\) e o IRRF sobre remessas ao exterior (R\$ 86,2 bilhões). O IRPJ/CSLL cabe à receita de empresas do MotorOrçamento.  
* **Propensão ao Consumo:** recalibrada com estimativas da POF para o Brasil: de 0,85 a 0,91 para os 92% mais pobres e de 0,42 a 0,62 para os 8% mais ricos (POF 2002-03 e 2008-09). Os valores por classe (95%, 90%, 85%, 70% e 45%) dão uma propensão média de cerca de 0,72, ponderada pela renda estimada de cada classe, dentro da faixa de 0,69 a 0,80 desses estudos.  
* **Coeficiente de PIB (seção 3.2):** 0,018 ponto percentual por R\$ 1 bilhão de consumo (antes 0,015). O IPEA estima o multiplicador de impacto da carga tributária líquida no Brasil em cerca de \-0,14: cada R\$ 1 de imposto a mais reduz o PIB em R\$ 0,14. Dividido pela propensão média de 0,72, cada R\$ 1 de consumo adicional gera R\$ 0,19 de PIB, ou 0,018% do PIB mensal de R\$ 1,06 trilhão. Esse valor é um efeito de nível: recomenda-se aplicá-lo à variação do consumo em relação ao mês anterior, e não à diferença acumulada desde a referência, para que o efeito não se repita todo mês.  
* **Coeficiente de inflação (seção 3.3):** 0,00055 ponto percentual por R\$ 1 bilhão de consumo (antes 0,008). O Banco Central estima que 1 ponto de hiato do produto eleva a inflação trimestral de preços livres em 0,12 ponto (intervalo de 90%: 0,072 a 0,198). Em base mensal, são 0,04 ponto. Com preços livres em cerca de três quartos do IPCA (premissa), chega-se a 0,03 ponto de IPCA por ponto de hiato. Multiplicado por 0,018 ponto de hiato por R\$ 1 bilhão de consumo, o resultado é 0,00055. O canal de demanda é fraco, de modo que uma mudança de imposto sozinha quase não move o IPCA.  
* **Parâmetros sem alteração:** a Curva de Laffer da seção 3.1 (limiar de 30%, perda de 1,8% por ponto e piso de 50%), o Índice de Fuga de Capital (1,0 ponto por ponto percentual) e os fatores políticos das seções 4.1 e 4.2 (150, 85 e \-1,3 ponto). Não há estimativa utilizável para o Brasil que os sustente, então são parâmetros de jogabilidade a ajustar por teste.

Fontes: Pitombo e Leite (POF 2002-03 e 2008-09, propensão ao consumo), IPEA (multiplicadores fiscais no Brasil), Banco Central (Relatório de Inflação de junho de 2024, curva de Phillips), Receita Federal (arrecadação de 2025), IBGE (PIB e rendimentos de 2025\) e Tendências Consultoria (classes sociais).