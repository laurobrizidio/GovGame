# MotorBC

Legenda: [CONFIRMADO] decidido com o Lauro · [A CONFIRMAR] proposta ainda sem resposta · [PENDENTE] falta definir ou calibrar. Coeficientes são pontos de partida, a calibrar jogando.

## 1. Visão geral

O BC é independente e age por **regra automática**; o jogador não controla a Selic, mas a influencia pela inflação, pelo PIB e pelo Risco Fiscal. [CONFIRMADO]

Blocos ativos: (1) Selic, (2) crédito e inadimplência, (3) intervenção cambial e reservas. [CONFIRMADO]

Fixos ou só indicadores: compulsório, tarifas, teto do rotativo, Pix e cartões. [CONFIRMADO]

## 2. Selic

- Valor inicial: **15,0%** (mantida desde junho de 2025). [CONFIRMADO]
- Reuniões nos **meses pares**. Movimento em múltiplos de **0,25 p.p.**, máximo de **1 p.p.** por reunião. [CONFIRMADO]
- **Selic alvo** = 15,0 + 1,5 × (IPCA 12m − 4,26) + 0,5 × (PIB 12m − 2,0) + 0,5 × prêmio de risco (p.p. ao ano). [CONFIRMADO; a seção 2.1 propõe substituir a referência de 15 e de 4,26]
- Movimento = metade da distância até o alvo, arredondada a 0,25 p.p., limitada a ±1 p.p. [CONFIRMADO]
- Limites da Selic: **−5% a 30%** (definido pelo Lauro). [CONFIRMADO]
- Com os dados de 2025 o alvo dá 15%: o BC mantém a taxa até algo mudar.
- Selic mensal = (1 + Selic anual)^(1/12) − 1 (≈ 1,17% ao mês com 15%). [CONFIRMADO]

### 2.1 Meta e Selic neutra

- **Meta do IPCA: 3%**, tolerância de 1,5 p.p. (teto 4,5%). Se o IPCA está acima da meta, o BC mantém os juros altos por mais tempo para reduzir consumo e crédito. [CONFIRMADO]
- **Selic neutra (padrão): 7%.** Acima de 7% é aperto monetário; abaixo é afrouxamento (rótulo possível no painel). [CONFIRMADO]
- **Selic alvo proposta** = 7 + 1,5 × (IPCA 12m − 3) + 0,5 × (PIB 12m − 2,0) + 0,5 × prêmio de risco. No início dá ≈ 9%, bem abaixo dos 15% iniciais; por isso depende da regra de corte da seção 2.2. [A CONFIRMAR]
- **Problema de calibração [PENDENTE]:** os efeitos da Selic (freio do PIB, crédito, inadimplência, dólar alvo) usam 15% como referência. Com os coeficientes atuais, uma Selic fixa em 7% leva o PIB 12m a ~4,3% e o IPCA 12m a ~9% no mês 48; a Selic que fecha a meta de 3% fica perto de 17%. Para a neutra valer 7% é preciso reancorar os efeitos (potencial de crescimento, inclinação do freio, inércia inicial dos dados de 2025). Com um freio mais fraco (0,007 em vez de 0,02 p.p. por p.p.) a Selic em 7% ainda leva o IPCA a ~5,8%.

| Selic fixa | PIB 12m (mês 24) | IPCA 12m (mês 48) |
|---|---|---|
| 15% | 2,3% | 4,2% |
| 11% | 3,3% | 6,6% |
| 7% | 4,3% | 9,0% |

### 2.2 Regra de corte pela tendência do IPCA [CONFIRMADO: lógica; k e N a calibrar]

O BC olha a **variação do IPCA 12m**, não só o nível: se o IPCA está caindo em direção à meta, ele pode cortar sem esperar chegar a 3%, para não afetar PIB e demanda. Nas reuniões (meses pares):

- **Queda do IPCA:** d = IPCA 12m da reunião anterior − IPCA 12m atual.
- **IPCA acima de 3% e caindo (d > 0,02 p.p.):** corta k × d, em múltiplos de 0,25, no máximo 1 p.p., sem descer abaixo do alvo. Ponto de partida: **k = 2** (cada 1 p.p. de queda do IPCA libera 2 p.p. de corte). [A CONFIRMAR]
- **IPCA acima de 3% e sem cair:** mantém, ou sobe se o alvo pedir.
- **Estacionamento:** se o IPCA ficar sem cair acima da meta por **N reuniões seguidas** (ponto de partida **N = 3**), o BC sobe 0,25 p.p. por reunião até a queda retomar. [A CONFIRMAR]
- **IPCA em 3% ou menos:** passo normal, metade da distância até o alvo, arredondada a 0,25.
- **Dependência:** a regra usa o alvo da seção 2.1. Com o alvo atual da seção 2 (≈ 15,15%) o piso do alvo impediria qualquer corte.

Simulação (freio atual 0,02, ancoragem do MotorMacro §3.3, dólar parado):

| Regra | Selic (mês 12 / 48) | IPCA 12m (mês 12 / 48) | PIB 12m (mês 24) |
|---|---|---|---|
| Alvo puro, corta já | 9,50 / 12,00 | 3,93 / 5,81 | 3,65 |
| Histerese rígida (só corta com IPCA ≤ 3%) | 15,00 / 15,00 | 3,78 / 3,55 | 2,30 |
| Tendência k = 2, sem estacionamento | 14,00 / 13,75 | 3,79 / 4,02 | 2,58 |
| Tendência k = 3, sem estacionamento | 13,75 / 13,25 | 3,80 / 4,25 | 2,67 |
| Tendência k = 2 + estacionamento N = 3 | 14,00 / 15,75 | 3,79 / 3,63 | 2,57 |

- O alvo puro corta cedo demais e superaquece (IPCA volta a 5,8%). A histerese rígida trava a Selic em 15% porque o IPCA estaciona em 3,55%.
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
