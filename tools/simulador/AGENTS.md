# Simulador em lote (`tools/simulador`)

- Bots (passivo, austeridade, populista...) jogam os 48 turnos.
- Relatório: em que mês cada um termina e por qual final, séries de aprovação, dívida/PIB e Risco Fiscal, e a lista de coeficientes ainda `a_confirmar`/`pendente` que influenciaram o resultado.
- Os coeficientes marcados "a calibrar jogando" são ajustados por aqui, editando `data/2025/coeficientes.json`.
- Varredura de um coeficiente: `pnpm --filter @govgame/simulador varredura <motor.chave> <v1,v2,...> [--partidas=250] [--semente=2025] [--fixo=motor.chave=valor,...]`. Para cada valor roda os bots e centenas de partidas aleatórias moderadas e mostra o resultado dos bots, a taxa de impeachment e a correlação parcial da aprovação com os indicadores (centrada por mês e controlada pela alíquota da classe A). Os valores testados ficam só em memória e passam a constar como `a_confirmar`; o JSON não é alterado.
