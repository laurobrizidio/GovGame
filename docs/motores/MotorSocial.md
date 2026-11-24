# MotorSocial

Legenda: \[CONFIRMADO\] decidido com o Lauro · \[A CONFIRMAR\] proposta ainda sem resposta · \[PENDENTE\] falta definir ou calibrar.

## 1\. Visão geral

- Único escritor da **Aprovação** e do **Desemprego**. \[CONFIRMADO\]  
- Regra de popularidade: cada motor devolve apenas uma **variação de popularidade**. A simulação central soma tudo e limita entre 0 e 100\. Nenhum outro motor sobrescreve a aprovação. \[CONFIRMADO\]  
- Eventos (calamidades, escândalos) estão fora do jogo por enquanto. \[CONFIRMADO\]

## 2\. Entradas

| Origem | O que entra |
| :---- | :---- |
| MotorIR | Variação de satisfação por classe e penalidade de injustiça (que também segue separada para as manchetes) e alíquotas vigentes das cinco classes |
| MotorOrçamento | Variação de popularidade pela Qualidade dos Serviços (0,03 × (Qualidade − 100), calculada no MotorOrçamento, seção 11\) e −1 ponto por mês durante a crise de rolagem; também o gasto de Assistência Social e Trabalho e a nota de serviço da Saúde |
| MotorMacro | IPCA em 12 meses e PIB em 12 meses |
| MotorBC | Inadimplência (segmento Famílias endividadas) |
| MotorSubsídios | Custo político de cortar renúncia (a confirmar) |

A conversão da escala "pontos" do MotorIR (150 e 85\) para pontos de aprovação: dividir por 100\. Cada \+1 p.p. de alíquota tira 1,5 ponto da aprovação das classes E e D e 0,85 ponto das classes C, B e A; a Aprovação Geral é a média ponderada pelos pesos das classes. \[CONFIRMADO\]

## 3\. Aprovação por classe \[CONFIRMADO\]

- Guardada por classe de renda E, D, C, B e A, com pesos populacionais 22,3% / 27,1% / 31,7% / 15,0% / 3,9%.  
- **Aprovação Geral** \= média ponderada pelos pesos.  
- Inércia: a aprovação se move apenas uma fração da distância até o alvo a cada mês (fração de 1/3 por mês, a calibrar). Vale para os efeitos de nível (IR por classe e Índice de Miséria); os efeitos de fluxo (Qualidade dos Serviços, crise de rolagem e injustiça tributária) entram direto, sem inércia. \[CONFIRMADO\]

## 4\. Índice de Miséria \[CONFIRMADO\]

- Índice de Miséria \= IPCA em 12 meses \+ taxa de desemprego \+ quatro componentes de ajuste (abaixo). Valor inicial ≈ 4,26 \+ 5,6 ≈ 9,9 (os componentes de ajuste começam em zero).  
- Fator de aperto (F): vai de 0 a 1 e mede se a economia já está ruim. F é o menor entre o fator da inflação (0 com IPCA em 12 meses até 4,5%; 1 com 8% ou mais) e o fator do desemprego (0 até 6,0%; 1 com 9% ou mais). Todos os componentes de ajuste são multiplicados por F; no início do jogo F \= 0\. \[A CONFIRMAR: limites\]  
- Imposto (direto): 0,5 × aumento médio da alíquota de IR × F. O aumento médio é a média das cinco classes ponderada pela população, em p.p. em relação à alíquota inicial; cortar imposto reduz o índice. \[CONFIRMADO: vínculo\] \[A CONFIRMAR: fator 0,5\]  
- Inadimplência (direto): 0,5 × variação da inadimplência das famílias, em p.p. em relação ao valor inicial × F. \[CONFIRMADO: vínculo\] \[A CONFIRMAR: fator 0,5\]  
- Proteção social (inverso): −0,5 para cada 10% de gasto acima do valor inicial, somando Assistência Social e Cidadania com Trabalho, × F. Gasto abaixo do inicial aumenta o índice. \[CONFIRMADO: vínculo\] \[A CONFIRMAR: fator 0,5\]  
- Saúde (inverso): \+0,03 × (100 − nota de serviço da Saúde) × F. Quanto melhor o serviço de saúde, menor o índice. \[CONFIRMADO: vínculo\] \[A CONFIRMAR: fator 0,03\]  
- Exemplo em crise (F \= 1): IR de todas as classes \+5 p.p. soma \+2,5 ao índice, ou cerca de −10 pontos de aprovação com o coeficiente 4,0.  
- Efeito na aprovação: coeficiente inicial **4,0 pontos de aprovação por 1 p.p.** de variação do índice, com inércia.  
- Referência (MB Associados, 1 p.p. de miséria equivale a): 2,2 (FHC), 3,7 (Temer), 4,3 (Dilma), 5,8 (Lula III).

## 5\. Desemprego \[CONFIRMADO\]

- Valor inicial: **5,6%** (média anual de 2025; 5,1% no 4º trimestre).  
- Regra mensal: Δdesemprego (p.p.) \= −0,25 / 12 × (crescimento do PIB em 12 meses − 2,0).  
- Crescimento potencial: 2,0% ao ano (parâmetro). Piso estrutural: **4,0%**.  
- O PIB entra com defasagem de 1 mês. Coeficiente −0,25 é ponto de partida (estudo em painel no Brasil); calibrar.

## 6\. Os 20 segmentos sociais \[CONFIRMADO\]

Segundo eixo, sobreposto às classes de renda (ricos e pobres são as classes A/B e E/D):

1. Trabalhadores formais  
2. Informais e autônomos  
3. Desempregados  
4. Pequenos negócios (Simples e MEI)  
5. Industriais  
6. Exportadores  
7. Produtores rurais  
8. Setor de energia  
9. Construção e imobiliário  
10. Infraestrutura e transportes  
11. Servidores públicos  
12. Educadores  
13. Estudantes e jovens  
14. Profissionais de saúde  
15. Pesquisadores e universidades  
16. Aposentados e pensionistas  
17. Beneficiários de programas sociais  
18. Profissionais liberais e gestores  
19. Famílias endividadas (reage à inadimplência)  
20. Mercado financeiro e investidores

Regras:

- Os segmentos **não entram** na Aprovação Geral (que é ponderada por classe). Eles geram pressões, que também custam popularidade (ver abaixo).  
- Uma fórmula genérica de soma ponderada, com tabela de pesos (os pesos não precisam somar 100%).  
- Satisfação do segmento (0 a 100, começa em 50): alvo \= 50 \+ 2 × soma de (peso × unidades de variação em relação a 2025). Unidades: 1 p.p. de IPCA, desemprego, PIB, inadimplência ou IR de classe; 2 p.p. de Selic; 10% de dólar; 10% de gasto ou subsídio em relação ao valor inicial; 10 pontos de Risco Fiscal; 5 p.p. de dívida/PIB; 5 pontos de fuga de capital. A satisfação anda 1/3 do caminho até o alvo a cada mês. \[CONFIRMADO: a calibrar\]  
- Pressão: dispara quando a satisfação fica abaixo de 30 e só sai quando volta a 40 ou mais. Teto de 5 pressões simultâneas exibidas; havendo mais segmentos abaixo do limiar, aparecem os 5 com menor satisfação. \[CONFIRMADO\]  
- Custo de popularidade: até 5 pressões não custam popularidade. A partir da 6ª, cada pressão excedente tira 0,5 ponto de popularidade por mês (6 pressões: −0,5; 10 pressões: −2,5). \[CONFIRMADO\]  
- Pesos e variáveis de cada segmento: ver a tabela abaixo (peso 3 \= forte, 2 \= médio, 1 \= fraco; o sinal indica o efeito sobre a satisfação). \[CONFIRMADO\] Texto de cada pressão: ver a terceira coluna da tabela. \[CONFIRMADO\] Dados de população dos segmentos (PNAD, RAIS, INSS) só para calibrar intensidade; buscar depois.

| Segmento | Variáveis e pesos | Texto da pressão |
| :---- | :---- | :---- |
| Trabalhadores formais | IPCA −3, desemprego −2, IR das classes D e C −2, PIB \+1 | Sindicatos reclamam: o salário perde para a inflação e o emprego preocupa. |
| Informais e autônomos | desemprego −3, IPCA −2, PIB \+2 | Informais e autônomos dizem que o bolso aperta e o trabalho some. |
| Desempregados | desemprego −3, Assistência Social \+2, Trabalho \+2 | Desempregados cobram emprego e apoio do governo. |
| Pequenos negócios (Simples e MEI) | Selic −3, PIB \+2, subsídio de Serviços e comércio \+2, Administração \+1 | Micro e pequenos empresários pedem crédito mais barato e menos burocracia. |
| Industriais | subsídio da Indústria \+3, Selic −3, gasto em Indústria, Comércio e Turismo \+1 | A indústria reclama de juros altos e da falta de incentivo. |
| Exportadores | dólar alto \+3, Infraestrutura \+2, Relações Exteriores \+1 | Exportadores pedem câmbio mais favorável e melhor logística. |
| Produtores rurais | subsídio do Agro \+3, Selic −2, dólar alto \+2, gasto em Agropecuária \+2 | Produtores rurais protestam: crédito caro e pouco apoio ao campo. |
| Setor de energia | subsídio de Energia \+3, Selic −2, Infraestrutura \+1 | Empresas de energia cobram incentivos e investimento em infraestrutura. |
| Construção e imobiliário | subsídio de Moradia \+3, Selic −3, PIB \+1, Infraestrutura \+1 | Construtoras alertam para a queda do financiamento habitacional. |
| Infraestrutura e transportes | subsídio de Infraestrutura \+3, gasto em Infraestrutura \+3, Selic −1 | O setor de transportes cobra obras paradas e mais investimento. |
| Servidores públicos | Administração \+3, IPCA −2, IR das classes C e B −1 | Servidores ameaçam greve por salário e condições de trabalho. |
| Educadores | Educação \+3, IPCA −2 | Professores protestam por mais verba e valorização da educação. |
| Estudantes e jovens | Educação \+3, desemprego −2, Ciência e Tecnologia \+1, Cultura e Esportes \+1 | Estudantes vão às ruas contra cortes na educação e a falta de emprego. |
| Profissionais de saúde | Saúde \+3, IPCA −2 | Médicos e enfermeiros alertam para o colapso do atendimento. |
| Pesquisadores e universidades | Ciência e Tecnologia \+3, Educação \+2 | Cientistas denunciam a falta de verba para pesquisa e universidades. |
| Aposentados e pensionistas | IPCA −3, Saúde \+2 | Aposentados reclamam que a inflação corrói a aposentadoria. |
| Beneficiários de programas sociais | Assistência Social \+3, IPCA −2, desemprego −1 | Beneficiários pedem reforço do auxílio e dos serviços sociais. |
| Profissionais liberais e gestores | IR da classe B −3, Selic −2, PIB \+2, Administração \+1 | Profissionais liberais e gestores reclamam de imposto alto e juros. |
| Famílias endividadas | inadimplência −3, Selic −2, IPCA −2 | Famílias endividadas pedem alívio: inadimplência e juros altos. |
| Mercado financeiro e investidores | Risco Fiscal −3, dívida/PIB −2, fuga de capital −2, IPCA −1 | O mercado financeiro reage mal: dúvidas sobre as contas públicas. |

- 

## 7\. Calibração 2025

- Desocupação: média anual 5,6% (a menor da série), 4º trimestre 5,1%; ocupados ≈ 103 milhões; desocupados ≈ 6,2 milhões; informalidade 38,1%.  
- IPCA 2025: 4,26% (meta 3% com tolerância de 1,5 p.p.).

## 8\. Pendências

- Resolvido: fração de inércia da aprovação (1/3 por mês) e conversão da escala do MotorIR (dividir por 100).  
- Resolvido: fórmula da Qualidade dos Serviços e penalidades por ministério (MotorOrçamento, seção 11).  
- Resolvido: texto de cada pressão e custo de 0,5 ponto por pressão excedente (seção 6). (Pesos, escala, limiar e teto resolvidos na seção 6.)  
- Calibrar jogando: coeficiente de Okun (−0,25, mantido), coeficiente 4,0 do Índice de Miséria (mantido; é a média das referências da MB Associados) e fatores dos quatro componentes de ajuste.