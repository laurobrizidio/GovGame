# Dados (`data/`)

Parâmetros do jogo, versionados por ano. Coeficientes vêm dos documentos dos motores (`docs/motores/`).

```
data/2025/
├─ classes.json          # população, base tributável, alíquota de referência, propensão ao consumo
├─ ministerios.json      # 15 ministérios, pastas incluídas, valor inicial, parte obrigatória/discricionária
├─ subsidios.json        # 6 setores × (renúncia, subsídio)
├─ segmentos.json        # 20 segmentos: variáveis, pesos (3/2/1, com sinal) e texto da pressão
├─ coeficientes.json     # todos os coeficientes dos motores, cada um com { valor, status, fonte }
├─ iniciais.json         # estado inicial 2025 (dívida, Caixa, Selic, IPCA, dólar, reservas...)
└─ textos.pt-BR.json     # manchetes, avisos, textos de pressão, regimes de inflação
```

- Validar tudo com **zod** no carregamento. Dado inválido = erro claro na inicialização, nunca valor silencioso.
- Cada coeficiente guarda `status` (`confirmado` | `a_confirmar` | `pendente`) e a seção do documento de origem. O simulador de calibração usa isso para listar o que ainda é provisório.
- **Unidades:** R$ bilhões e pontos percentuais. Deixe a unidade no nome da variável (`selicAa`, `ipca12m`, `pibMensalBi`, `despesaPrimariaBi`). Os documentos misturam mensal e anual; a conversão fica num único lugar (os mockups mostram R$ bi **por mês**; os documentos listam **por ano**, divida por 12 só na camada de apresentação).
- Trocar de ano (`data/2026/`...) deve exigir **zero mudança de código**.
