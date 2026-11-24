# MotorBC

Legenda: [CONFIRMADO] decidido com o Lauro · [A CONFIRMAR] proposta ainda sem resposta · [PENDENTE] falta definir ou calibrar. Coeficientes são pontos de partida, a calibrar jogando.

## 1. Visão geral

O BC é independente e age por **regra automática**; o jogador não controla a Selic, mas a influencia pela inflação, pelo PIB e pelo Risco Fiscal. [CONFIRMADO]

Blocos ativos: (1) Selic, (2) crédito e inadimplência, (3) intervenção cambial e reservas. [CONFIRMADO]

Fixos ou só indicadores: compulsório, tarifas, teto do rotativo, Pix e cartões. [CONFIRMADO]

## 2. Selic

- Valor inicial: **15,0%** (mantida desde junho de 2025). [CONFIRMADO]
- Reuniões nos **meses pares**. Movimento em múltiplos de **0,25 p.p.**, máximo de **1 p.p.** por reunião. [CONFIRMADO]
- **Selic alvo** = 15,0 + 1,5 × (IPCA 12m − 4,26) + 0,5 × (PIB 12m − 2,0) (p.p. ao ano). O prêmio de risco não entra na meta. Este é o alvo automático do BC e é independente da Selic neutra. [CONFIRMADO]
- Movimento = metade da distância até o alvo, arredondada a 0,25 p.p., limitada a ±1 p.p. [CONFIRMADO]
- Limites da Selic: **−5% a 30%** (definido pelo Lauro). [CONFIRMADO]
- Com os dados iniciais de 2025 (IPCA 4,26% e PIB 2,3%), o alvo dá 15,15%.
- Selic mensal = (1 + Selic anual)^(1/12) − 1 (≈ 1,17% ao mês com 15%). [CONFIRMADO]

### 2.1 Meta e Selic neutra

- **Meta do IPCA: 3%**, tolerância de 1,5 p.p. (teto 4,5%). Se o IPCA está acima da meta, o BC mantém os juros altos por mais tempo para reduzir consumo e crédito. [CONFIRMADO]
- **Selic neutra (padrão): 7,5%.** Identifica o status monetário (acima: “aperto”; abaixo: “afrouxamento”; igual: “neutro”). Quando IPCA, desemprego e PIB estiverem nas respectivas metas e estáveis, o alvo calculado pelo BC deve convergir gradualmente para 7,5%. [CONFIRMADO]
- Fora dessa condição, o alvo do BC é calculado para perseguir as metas das outras variáveis. A regra atual reage aos níveis do IPCA 12m e do PIB 12m; a inclusão das variações e tendências do IPCA e do desemprego está detalhada na seção 2.2.
- **Problema de calibração [PENDENTE]:** os efeitos da Selic (freio do PIB, crédito, inadimplência, dólar alvo) usam 15% como referência. Com os coeficientes atuais, uma Selic fixa em 7% leva o PIB 12m a ~4,3% e o IPCA 12m a ~9% no mês 48. O canal implementado é indireto: Selic → PIB → desemprego → consumo, PIB e IPCA.

| Selic fixa | PIB 12m (mês 24) | IPCA 12m (mês 48) |
|---|---|---|
| 15% | 2,3% | 4,2% |
| 11% | 3,3% | 6,6% |
| 7% | 4,3% | 9,0% |

### 2.2 Tendências para decisões do BC [CONFIRMADO]

Nas reuniões (meses pares), o BC mede IPCA 12m e desemprego desde a reunião anterior. A tendência do IPCA é o sinal principal; a do desemprego ajusta o ritmo.

- **Meta de desemprego para a regra monetária: 5%.** [CONFIRMADO]
- Se IPCA, desemprego e PIB estiverem estáveis e dentro das respectivas metas, a Selic tende gradualmente à neutra de **7,5%**. A taxa efetiva continua se movendo pelos passos normais das reuniões.
- Considerar as metas cumpridas quando, em **duas reuniões consecutivas**, o IPCA estiver entre **1,5% e 4,5%**, o desemprego entre **4,5% e 5,5%**, e o PIB entre **1,5% e 2,5%**, e as variações do IPCA e do desemprego entre essas reuniões forem, respectivamente, até **0,02 p.p.** e **0,05 p.p.** Nessa condição, o alvo da Selic passa a 7,5%; a taxa efetiva converge usando o movimento normal de metade da distância, em passos de 0,25 p.p. e máximo de 1 p.p. por reunião. [CONFIRMADO]
- Uma variação do IPCA até **0,02 p.p.** ou do desemprego até **0,05 p.p.** em qualquer direção é tratada como estável.
- Para o IPCA, o movimento adicional é **2 × a variação do IPCA 12m**, em p.p., arredondado ao passo de 0,25. Para o desemprego, aumento acima do limiar favorece corte de **0,25 p.p.**; queda acima do limiar favorece alta de **0,25 p.p.** Esses ajustes alteram o ritmo normal de convergência ao alvo e o movimento total permanece limitado a ±1 p.p. por reunião.
- **IPCA subindo e desemprego subindo:** sinais conflitantes; o BC mantém a taxa na primeira reunião. Se a alta conjunta persistir na reunião seguinte, sobe um passo de 0,25 p.p.
- **IPCA caindo e desemprego subindo:** os dois sinais favorecem corte. **IPCA e desemprego caindo:** o desemprego reduz o ritmo do corte. **IPCA subindo e desemprego caindo:** os dois sinais favorecem aperto.
- Sem tendência relevante, o BC segue o movimento normal de metade da distância ao alvo, arredondado a 0,25 p.p.

Simulação da regra anterior, apenas com tendência do IPCA (freio atual 0,02, ancoragem do MotorMacro §3.3, dólar parado):

| Regra | Selic (mês 12 / 48) | IPCA 12m (mês 12 / 48) | PIB 12m (mês 24) |
|---|---|---|---|
| Alvo puro, corta já | 9,50 / 12,00 | 3,93 / 5,81 | 3,65 |
| Histerese rígida (só corta com IPCA ≤ 3%) | 15,00 / 15,00 | 3,78 / 3,55 | 2,30 |
| Tendência IPCA somente, k = 2, sem estacionamento (regra anterior) | 14,00 / 13,75 | 3,79 / 4,02 | 2,58 |
| Tendência IPCA somente, k = 3, sem estacionamento (regra anterior) | 13,75 / 13,25 | 3,80 / 4,25 | 2,67 |
| Tendência IPCA somente, k = 2 + estacionamento N = 3 (regra anterior) | 14,00 / 15,75 | 3,79 / 3,63 | 2,57 |

- Esses resultados são da regra anterior, apenas com IPCA; ainda não medem a resposta combinada implementada nesta seção. Neles, o alvo puro corta cedo demais e superaquece (IPCA volta a 5,8%), enquanto a histerese rígida trava a Selic em 15% porque o IPCA estaciona em 3,55%.
- A tendência corta já no primeiro ano (15% → 14%) com o PIB maior (2,3% → ~2,6%), mas o IPCA para de cair e volta a ~4%. O estacionamento corrige isso: o IPCA fecha o mandato em ~3,6% e continua caindo (~3,3% no mês 72). A meta de 3% não é atingida em 48 meses só pela regra do BC: depende também da política fiscal do jogador.
- Com k = 1 o resultado é igual ao da histerese, porque a queda por reunião é pequena e o corte arredonda para zero.

## 3. Custo da dívida [CONFIRMADO]

- Custo da dívida = média móvel de 12 meses da Selic + prêmio de risco do mês anterior, com **piso de 0%**.
- Uma alta da Selic pesa nos juros aos poucos (rolagem gradual).
- O MotorTurno guarda 12 meses de histórico da Selic, partindo de 15%.

## 4. Crédito e inadimplência [CONFIRMADO]

Valores iniciais: saldo do crédito SFN ≈ R$ 7,1 trilhões, crescimento de ≈ 10,3% em 12 meses; inadimplência total 4,1% (famílias 5%, empresas 2,5%); juros médios às famílias 60,1% ao ano; endividamento das famílias 49,7% da renda e comprometimento 29,2%.

- **Crescimento do crédito (12m, nominal)** = 10,3 − 0,6 × (Selic de 3 meses atrás − 15) + 1,0 × (PIB 12m − 2,0) − 1,0 × (inadimplência − 4,1)
- **Inadimplência alvo** = 4,1 + 0,10 × (Selic média dos últimos 9 meses − 15) + 0,25 × (desemprego − 5,6)
- A inadimplência se aproxima do alvo **10% da distância por mês** (reproduz a defasagem de ≈ 9 meses da Selic).
- Se a inadimplência passar de **6%**, o crédito entra em aperto: o crescimento cai pela metade. Na simulação o gatilho quase nunca dispara (Selic fixa em 19% leva a inadimplência a ~4,5%). [PENDENTE: manter 6%, baixar para ~5% ou tratar como freio de crise]
- As constantes são calibradas para o jogo começar em 10,3% de crescimento e 4,1% de inadimplência.
- Ligações: o crescimento do crédito vira ΔPIB no MotorMacro (seção 4.1); a inadimplência alimenta o segmento Famílias endividadas no MotorSocial.

### 4.1 Crédito na demanda (efeito variável) [A CONFIRMAR]

O efeito do crédito na demanda **nunca é fixo**: varia com outros parâmetros do jogo.

- **Impulso no PIB** (p.p. do PIB mensal) = φ × crédito em % do PIB × (crescimento do crédito 12m − 10,3) / 12. Com o crédito em ≈ 56% do PIB (R$ 7,1 tri ÷ R$ 12,7 tri) e φ = 20%, isso equivale a κ ≈ 0,10 p.p. de PIB ao ano por p.p. de crescimento do crédito.
- **Freio da Selic dividido, sem contar duas vezes:** o freio total de 0,02 p.p. por p.p. de Selic passa a 0,015 direto (custo do capital e investimento) + 0,005 via crédito (0,6 × 0,10 ÷ 12). O total não muda.
- Caminho único para o IPCA: Selic → crédito → PIB → demanda (MotorMacro §3.1). Sem canal paralelo de consumo.
- **Três degraus**, cada um com parâmetros próprios (todos do mês anterior):
  1. **Demanda por crédito:** juros reais (−), PIB 12m (+), desemprego (−), Índice de Miséria (−, proxy de confiança), renda disponível das classes pelo MotorIR (+), subsídios a Moradia, Agro e Infraestrutura (+, crédito direcionado).
  2. **Oferta de crédito:** inadimplência (−), prêmio de risco e Risco Fiscal (−, spread), compulsório (−, quando sobe), crise de rolagem (−). O crédito efetivo é limitado pelo menor entre demanda e oferta.
  3. **Fração do crédito novo que vira gasto (φ):** comprometimento da renda (−), endividamento das famílias (−), composição de renda (classes E–D gastam mais; a classe A poupa mais), tipo de crédito (habitação e agro tendem a investimento), dólar alto (−, via dívida das empresas).
- Forma sugerida: φ = φ₀ × Π (1 + β_i × z_i), com z_i = desvio de cada parâmetro em relação ao valor inicial, φ₀ = 20% e resultado limitado entre 0,5 × φ₀ e 1,5 × φ₀.
- A Aprovação Geral **não** entra como parâmetro (o MotorSocial é o único escritor e ela é só saída); usar o Índice de Miséria como proxy de confiança.
- Conjunto inicial sugerido, para não ficar difícil de calibrar: juros reais, comprometimento da renda, Índice de Miséria, prêmio de risco e composição de renda. [PENDENTE: o Lauro escolhe]
- Simulação de referência (Selic em 17% por N meses, depois 15%): o canal quase não muda o efeito total; muda a dinâmica (defasagem de 3 meses e inadimplência que acumula). Aperto curto é só alívio temporário (IPCA volta a ~4,1%); só o aperto longo leva à meta.

## 5. Intervenção cambial e reservas [CONFIRMADO]

O dólar é calculado no MotorMacro; o MotorBC só intervém.

- Reservas iniciais: **US$ 358,23 bilhões** (dezembro de 2025).
- Se o dólar subir mais de **3% em um mês**, o BC vende reservas automaticamente. Cada US$ 10 bi vendidos seguram 1% de alta, com limite de **10% das reservas por mês**.
- Reservas paradas rendem **0,3% ao mês**.
- Reservas abaixo de **US$ 200 bi** somam **+1 p.p.** ao prêmio de risco.

## 6. Itens fixos e indicadores [CONFIRMADO]

| Item | Tratamento |
| :---- | :---- |
| Pix | Indicador; cresce com o consumo do mês anterior; inicial: R$ 35,36 tri e ≈ 79,8 bi de transações em 2025 (proposta de ligação ao crédito na seção 6.1) |
| Cartões | Indicador; inicial: R$ 4,5 tri e 48,1 bi de transações em 2025 |
| Compulsório | Parâmetro fixo (à vista 21%; demais alíquotas a confirmar); pode virar gatilho automático em crise de crédito |
| Teto do rotativo e tarifas | Regras fixas, sem simulação |

### 6.1 Pix ligado ao consumo e ao crédito [A CONFIRMAR]

- **Valor** = Pix₀ × (consumo real ÷ inicial) × (nível de preços ÷ inicial) × (1 + adoção)^(t/12), com o consumo real do MotorIR mais o gasto financiado por crédito (φ × crédito novo).
- **Transações** = valor ÷ ticket médio. Ticket inicial ≈ R$ 443 (R$ 35,36 tri ÷ 79,8 bi), acompanhando o IPCA.
- **Adoção:** tendência estrutural de crescimento, como parâmetro.
- Para o jogador, o Pix reage ao consumo no mesmo mês, antes de o PIB aparecer: pode servir de indicador antecedente.

## 7. Conexões

- Recebe: IPCA 12m, PIB 12m, desemprego, prêmio de risco (MotorOrçamento), variação do dólar (MotorMacro).
- Envia: Selic (MotorOrçamento e MotorMacro), crédito (ΔPIB para o MotorMacro), inadimplência (MotorSocial), venda de reservas e nível de reservas (prêmio de risco).
- O MotorTurno guarda o histórico de Selic (12 meses), inadimplência e crédito. A regra de corte (seção 2.2) também exige guardar o IPCA 12m da reunião anterior e a contagem de reuniões sem queda.

## 8. Pendências

- Reancorar os efeitos da Selic na neutra de 7% (seção 2.1) e decidir o início do jogo (inércia dos dados de 2025 ou freio mais fraco).
- Confirmar k, N e o limiar de queda (0,02 p.p.) da regra de corte (seção 2.2).
- Coeficiente do impulso do crédito no PIB e parâmetros de φ (seção 4.1); gatilho de inadimplência (6%, 5% ou fim).
- Alíquotas de compulsório além da à vista.
- Calibração de todos os coeficientes; relação entre prêmio de risco e reservas.
