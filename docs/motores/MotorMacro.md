# MotorMacro

Legenda: [CONFIRMADO] decidido com o Lauro · [A CONFIRMAR] proposta ainda sem resposta · [PENDENTE] falta definir ou calibrar. Coeficientes são pontos de partida, a calibrar.

## 1. Visão geral

Fecha as três variáveis macro do mês: **PIB**, **IPCA** e **dólar**. Tudo que depende do resultado do mês usa o valor do mês anterior. [CONFIRMADO]

Ordem interna do motor: (1) dólar, (2) PIB, (3) IPCA. O dólar do mês usa o IPCA 12m do mês anterior e a Selic já decidida pelo MotorBC no mês. O IPCA do mês usa a variação do dólar do mês (Δd) e o PIB 12m do mês anterior. [A CONFIRMAR]

Aleatoriedade: o único sorteio do jogo é o ruído do dólar (seção 4). Ele usa um gerador pseudoaleatório com semente guardada no Estado, então o motor continua sendo função pura: mesma semente e mesmas decisões dão a mesma partida. Sem `Math.random`. [CONFIRMADO]

## 2. PIB [CONFIRMADO]

Valores iniciais: PIB 2025 = R$ 12,7 trilhões (≈ R$ 1.060 bi por mês); crescimento de 2,3% em 2025.

- **PIB real mensal** = base de 0,19% ao mês (2,3% ao ano, com Selic em 15% como referência)
  - **+** soma dos impulsos (em p.p. do PIB mensal): MotorIR, MotorSubsídios (defasagem de 2 turnos), gasto público, crédito e dólar
  - **−** freio da Selic: 0,02 p.p. ao mês para cada p.p. da Selic média dos últimos 6 meses acima de 15% (abaixo de 15% o efeito é positivo)
- **PIB nominal** = PIB real × nível de preços (acumula o IPCA).
- O PIB real em 12 meses alimenta desemprego, Selic e crédito. O PIB nominal alimenta receita e dívida/PIB.
- Se o crédito passar a entrar explicitamente no PIB, o freio da Selic se divide em 0,015 direto + 0,005 via crédito, sem mudar o total (ver MotorBC §4.1). [A CONFIRMAR]

## 3. IPCA

Valores iniciais: IPCA em 12 meses = 4,26% (≈ 0,35% ao mês). Meta 3% com tolerância de 1,5 p.p. (teto 4,5%).

**IPCA do mês = núcleo + repasse cambial.** [CONFIRMADO]

### 3.1 Núcleo (tem inércia) [CONFIRMADO]

- **Núcleo do mês** = 0,90 × núcleo do mês anterior + 0,10 × meta mensal (0,25%) + c + impulsos (p.p. por mês):
  - Demanda: 0,02 × (PIB 12m − 2,0)
  - MotorIR: impulso já calculado pelo motor (coeficiente 0,00055)
  - MotorSubsídios: impulso de Agro e Energia
- **Intercepto c = 0,0028.** Calibrado para que o jogo sem choque mantenha a Selic em 15% por 48 meses e o IPCA 12m entre 4,13% e 4,28%. Sem ele o núcleo estável ficava em ≈ 0,31% ao mês, abaixo do inicial, e a Selic caía sozinha. A regra de arredondamento da Selic (0,25 p.p.) torna esse ajuste sensível. [A CONFIRMAR]
- Núcleo inicial: 0,348% ao mês (IPCA 12m de 4,26%).
- **O dólar não entra no núcleo**, para o repasse não passar pela inércia de 0,90 (que multiplicaria o efeito por 10).

### 3.2 Repasse cambial (transitório) [CONFIRMADO: estrutura; coeficientes a calibrar]

Comportamento desejado: uma alta do dólar causa pressão forte no IPCA a curto prazo e o efeito vai diminuindo se o dólar estabilizar. Referência: dólar +5% sobe o IPCA entre 0,1 e 0,5 p.p. no total.

- **Variação mensal do dólar** (fluxo, não a de 12 meses): Δd = (dólar do mês ÷ dólar do mês anterior − 1) × 100.
- **Assimetria:** Δd efetivo = Δd se for alta; a × Δd se for queda, com **a = 0,5**.
- **Pressão cambial:** E_t = λ × E_{t−1} + (1 − λ) × Δd efetivo, com **λ = 0,6** (≈ 90% do efeito em 4 meses) e E_0 = 0.
- **Repasse do mês (p.p. no IPCA do mês)** = θ × E_t − viés, com **θ = 0,06** p.p. por 1% de alta (faixa de referência: 0,02 a 0,10).
- **Recentragem (viés)** = θ × (1 − a) × 0,399 × σ, com σ em %. A assimetria faz o ruído do dólar sozinho empurrar o IPCA para cima; o viés desconta essa média para o jogo não derivar. Recalcular se σ ou a mudarem.
- Exemplo (salto de 5% que estabiliza, θ = 0,06): +0,12 no mês 1, +0,07, +0,04, +0,03, +0,02 e decaindo; total ≈ 0,30 p.p.
- Coeficientes (θ, λ, a) e viés: [A CONFIRMAR]

### 3.3 Ancoragem das expectativas pelo juro real [A CONFIRMAR]

Hoje a Selic só chega ao IPCA por Selic → PIB → demanda, que é lenta (inércia de 0,90 e janela de 12 meses). Proposta: juros reais altos aumentam o peso da meta no núcleo.

- **Juro real** = Selic do mês anterior − IPCA 12m do mês anterior. **Neutro real** = 7 − 3 = 4 p.p. (Selic neutra 7% e meta 3%).
- **Peso da meta** w = 0,10 + a × max(0, juro real − 4), com **a = 0,015** e teto de 0,30.
- **Núcleo** = (1 − w) × núcleo anterior + w × meta mensal (0,25%) + c + demanda. Com juro real abaixo do neutro, w = 0,10 como na seção 3.1.
- Simulação com Selic fixa (IPCA 12m, meses 12 e 24; "hoje" = seção 3.1):

| Selic | Hoje (12 / 24) | Com ancoragem (12 / 24) | Chega a 3% |
|---|---|---|---|
| 15% | 4,20 / 4,15 | 3,78 / 3,57 | não, estaciona em ~3,55 |
| 17% | 4,09 / 3,44 | 3,63 / 3,08 | mês 33 (hoje: mês 42) |
| 13% | 4,31 / 4,86 | 3,96 / 4,21 | não, o IPCA sobe |

- Consequência: com a Selic em 15% e sem choque, o IPCA 12m cai de 4,26% para ~3,55%, o que combina com o regime "Desinflação" do começo do jogo. O intercepto c (seção 3.1) foi calibrado com w = 0,10 e precisa ser reavaliado se esta seção for aprovada.
- Opcional: reduzir w quando o IPCA passar do teto de 4,5% (desancoragem das expectativas).

### 3.4 Saídas e histórico

- IPCA em 12 meses vai para o MotorBC (Selic), MotorSocial (Índice de Miséria) e MotorOrçamento (correção do piso dos ministérios).
- Histórico inicial de 12 meses do IPCA: aproximado por 0,35% ao mês. [A CONFIRMAR]

### Regimes de inflação (rótulo no painel, só o regime) [CONFIRMADO]

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

## 4. Dólar [CONFIRMADO]

Valor inicial: **R$ 5,49** (R$ 5,487 no fim de 2025, queda de 11,19% no ano).

- **Dólar alvo** = 5,49 × (1 + 0,05 × prêmio de risco (p.p.) + 0,02 × fuga de capital do MotorIR − 0,01 × (Selic − 15) + 0,01 × (IPCA 12m − 4,26))
- **Dólar do mês** = dólar do mês anterior + 0,20 × (alvo − dólar do mês anterior) + ε × dólar do mês anterior.
- O dólar anda **20% da distância** até o alvo por mês (decisões do jogador entram pelo alvo).
- **Ruído de mercado:** ε ~ Normal(0, σ), com **σ = 1,0% ao mês** como ponto de partida. [A CONFIRMAR] Faixa sugerida: 1% a 1,5%. Com σ acima de 2% o ruído sozinho leva o IPCA 12m acima de 4,5% em mais da metade dos jogos. σ é parâmetro de dificuldade. Com σ = 1% o dólar fica numa faixa de ±3% (p5–p95) em torno de R$ 5,49, por causa da reversão de 20% ao mês.
- **Sorteio com semente:** o Estado guarda a semente e o gerador avança a cada turno; a mesma semente reproduz a mesma sequência de choques.
- Risco fiscal, fuga de capital e inflação alta desvalorizam o real; Selic alta valoriza.
- A intervenção do BC (venda de reservas) está no MotorBC.

## 5. Ligações com o MotorOrçamento e o dólar [CONFIRMADO]

1. **Gasto público → PIB**: ΔPIB (% do PIB mensal) = m × (variação da despesa primária entre os dois meses anteriores, em R$ bi) / 1.060 × 100, com m = 0,5 e defasagem de 1 mês. Gastar acima do valor inicial estimula; cortar freia.
2. **PIB → receita de consumo e empresas**: receita do mês = valor inicial × (PIB nominal do mês anterior / PIB nominal inicial). Elasticidade 1, defasagem de 1 mês.
3. **Dólar → PIB** (exportações): ΔPIB mensal = 0,002 × variação do dólar em 12 meses (%), com defasagem de 3 meses (10% de desvalorização ≈ +0,02 p.p. ao mês). [PENDENTE: avaliar trocar a variação em 12 meses por fluxo, como no repasse ao IPCA. Na simulação o efeito líquido no PIB foi pequeno, porque a Selic mais alta compensa boa parte do ganho de exportação.]

## 6. Pendências

- Calibração de todos os coeficientes (freio da Selic, hiato, multiplicador do gasto, θ, λ, a, σ e c).
- Dólar → PIB: trocar por fluxo ou manter a variação em 12 meses.
- Ancoragem das expectativas (seção 3.3): confirmar a, o neutro real e o novo ponto de partida do IPCA.
- Impulso do crédito no PIB (vem do MotorBC, §4.1).
- Choques de oferta e expectativas de inflação (fora até haver eventos).
- Série inicial de 12 meses de PIB, IPCA e dólar.
