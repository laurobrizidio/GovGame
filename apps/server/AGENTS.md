# Servidor e persistência (`apps/server`)

Fastify + SQLite.

```
games(id, nome, params_version, created_at, status, final_tipo?)
turns(game_id, turn, decisions_json, state_json, result_json,
      aprovacao, divida_pib, risco_fiscal)        -- colunas indexadas só para gráficos
```

- O estado entra como **JSON**, não em tabelas normalizadas: ele muda a cada refino dos motores.
- `turns` guarda estado, decisões **e** o resultado (trace) de cada turno, porque "Rever o histórico" e a tela de Fim de jogo dependem disso.
- Parâmetros **não** vão para o banco (ficam em `data/<ano>/`).
- Acesso via uma interface `RepositorioDePartidas`. Na fase 1 pode ser IndexedDB/localStorage; o motor não muda.
