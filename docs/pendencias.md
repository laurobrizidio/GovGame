# Pendências e inconsistências conhecidas

Resolver com o Lauro antes de implementar o trecho afetado.

**Decisões em aberto**

1. **Piso de Saúde e Educação resolvido.** Lauro confirmou o piso de 60% do valor inicial, igual à parcela obrigatória, conforme MotorOrçamento §6. O jogador controla a parcela discricionária. A situação de gasto abaixo do piso exibida no canvas é ilustrativa.
2. **Nota de serviço → eficiência de cobrança do IR.** Proposta a confirmar. Usar a nota da Administração do mês anterior e calcular eficiência de arrecadação (%) como `80 + 0,2 × nota`. A regra usa os limites de 80% a 100% do MotorIR e aproveita a recuperação gradual da nota. Com nota 78, a proposta dá 95,6%. O canvas mostra 94%. Na implementação atual, uma vez que a nota cai, a arrecadação mostrada é a referência após Laffer e vem marcada como estimativa até a nota voltar a 100.
3. **Teto de pressões:** o MotorSocial diz 5 exibidas (custo de popularidade a partir da 6ª); Painel e Povo mostram "2 de 3 (teto)".
4. **Faixa "Perto do limiar" (30 a 35%)** consta no mockup. A histerese já consta no MotorSocial §6. A pressão entra abaixo de 30 e sai a partir de 40.
5. **Calibração dos limites de fim de jogo.** A pontuação segue o MotorTurno §7 e usa a aprovação inicial confirmada no item 11.
6. **Gatilho do socorro de calamidade** (depende de existir MotorEventos).
7. Limites dos sliders (aparentemente 0 a 1,3× o valor inicial no canvas) — confirmar e registrar no MotorSubsídios.
8. MotorBC: coeficiente do impulso do crédito no PIB, alíquotas de compulsório além da à vista, relação entre prêmio de risco e reservas.
9. MotorSubsídios: multiplicador m dos subsídios (≤ 0,14), valor inicial da renúncia de Infraestrutura e de Moradia (projeção 2026 a confirmar com 2025).
10. MotorMacro: série inicial de 12 meses de PIB, IPCA e dólar; calibração dos coeficientes (freio da Selic, hiato, repasse cambial, multiplicador do gasto).
11. **Aprovação inicial por classe resolvida.** Lauro confirmou 55% nas cinco classes. A aprovação geral começa em 55% antes do primeiro fechamento, pela média ponderada definida no MotorSocial §3. A base 2025.2 passa a usar esse valor.
12. **Escalas do Risco Fiscal.** Proposta a confirmar. Interpolar cada fator de 0 a 100, limitando nas pontas. O primário ajustado anualizado vai de +2% do PIB (0) a −8% (100). A dívida vai de 70% (0) a 100% do PIB (100). A conta de juros anualizada vai de 4% (0) a 14% (100) do PIB. Aplicar os pesos de 40%, 40% e 20% já previstos. Enquanto as escalas estiverem abertas, Risco Fiscal e prêmio fiscal ficam indisponíveis e os valores que dependem deles são estimativas.
13. **Inadimplência familiar.** O BC fornece uma série de inadimplência total. Falta a regra de evolução da série familiar usada no Índice de Miséria.
14. **Canais econômicos sem coeficiente.** Faltam os efeitos dos incentivos a Agro e Energia no IPCA e da degradação da Infraestrutura no IPCA. O custo político do corte de renúncia também aguarda calibração.
15. **Alvo inicial da Selic.** A fórmula do MotorBC §2 produz 15,15% ao usar o PIB de 2025 (2,3%) e o potencial de 2,0%. O texto diz que o alvo inicial é 15%. A implementação usa a fórmula e a Selic efetiva começa em 15%.
16. **Substituição de decisão em carência.** A implementação mantém uma mudança pendente por classe ou setor. Repetir a decisão mantém o prazo. Substituir a mudança antes da vigência reinicia a carência se a nova decisão também exigir espera. O documento não especifica se múltiplas mudanças na mesma alíquota ou renúncia devem vigorar em datas distintas.
17. **Retorno decrescente dos ministérios.** O Orçamento §5 descreve faixas provisórias, sem especificar qual saída é afetada. A despesa primária segue integralmente o valor escolhido e alimenta a regra do Macro §5.

**Divergências entre mockups e documentos**

- Notas amarelas antigas no Painel ("falta a fração de inércia") e no Povo ("pesos a definir"): já resolvidas no MotorSocial.
- Dólar do mês seguinte igual ao alvo (R$ 5,62) no Fechamento; pelo MotorMacro andaria 20% da distância (≈ R$ 5,59).
- Os valores do mês 7 nas telas são **ilustrativos**.
