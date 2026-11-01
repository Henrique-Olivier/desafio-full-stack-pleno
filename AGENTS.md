# AGENTS.md

## Contexto
Desafio técnico Fullstack Pleno: módulo de montagem de pedidos para vendedores externos que atendem pequenos varejistas, muitas vezes com internet ruim.

Stack: Vue 3 + Tailwind + shadcn (front, em `front-end/`), Node.js + TypeScript (back), PostgreSQL. Tudo deve subir com `docker compose up`.

## Como trabalhar
- Nunca sair codando. Antes de qualquer código, entender o pedido e apresentar as soluções possíveis (com prós e contras) para o problema que foi pedido.
- Esperar o usuário escolher antes de implementar.
- Resolver só o que foi pedido; não adicionar escopo por conta própria.
- Não colocar comentários no código. O código deve se explicar pelos nomes; contexto e justificativas vão para `DECISIONS.md`.

## Documento principal
`Desafio Técnico — Fullstack Pleno.pdf` (raiz). Fonte da verdade para requisitos, regras de domínio e entregáveis. Consulte antes de decidir escopo.

## Dados
`seed.json` (raiz). Usar como está; contém imperfeições propositais de dados reais.
Coleções: `supervisores`, `vendedores`, `clientes`, `produtos`, `tabelas_preco`, `pedidos_historico`.
`preco_unidade` é preço de uma unidade (não da embalagem); `fator_embalagem` é unidades por embalagem.

## Back-end (`back-end/`)
Express 5 + TypeScript (ESM, imports com `.js`), `pg` com SQL puro (sem ORM), `zod` para validar entrada. Arquitetura: Vertical Slices + Functional Core (detalhes e justificativa em `DECISIONS.md`).

```
back-end/
  db/            # .sql rodados pelo Postgres na 1ª subida (schema + seed lido do seed.json)
  src/
    core/        # regras de negócio: tipos + funções puras, sem Express e sem banco
    features/    # um arquivo por caso de uso: zod na entrada + SQL + chamada ao core
    autenticacao.ts  # login simulado: header X-Vendedor-Id -> req.vendedor (401 se ausente/inválido)
    db.ts        # Pool do pg (DATABASE_URL)
    main.ts      # sobe o Express e registra as features
```

Banco: `docker compose up -d db`. Mudou algum `.sql`? `docker compose down -v` e sobe de novo.

Regras:
- Regra de negócio só no `core/`. `core/` nunca importa Express, banco ou `fs`.
- Um arquivo por conceito em `core/` (`vendedor.ts`, `cliente.ts`, `catalogo.ts`, `pedido.ts`). Dependência em mão única: `pedido` importa os outros; a carteira (clientes do vendedor) fica em `vendedor.ts`, que pode importar `cliente.ts`, nunca o contrário.
- Tradução banco (snake_case) -> domínio (camelCase) fica em `features/` (alias no SQL ou map), nunca no `core/`.
- Violação de regra volta como dado (lista de problemas), não exceção; a feature responde 422.
- Nomes em português (linguagem do domínio/DDD; PDF = negócio e fonte da verdade, seed = parte técnica). Sem acento/`ç` em identificadores.
- Dinheiro: `numeric(12,2)` no banco; a API trafega em reais (`::float` no SQL). Centavos (inteiro) só dentro do back: `features/` converte antes de chamar o `core/` quando há conta. Quantidade sempre em unidades.
- Back recalcula preço e total; nunca confia em valor vindo do front.
- Toda função do `core/` com regra tem teste ao lado (`*.test.ts`, `node:test`). Rodar: `npm test`.

Exemplo de referência: `src/features/listar-produtos.ts` + `src/core/catalogo.ts` + `src/core/catalogo.test.ts`.

## Commits
- Sempre iniciar o título com prefixo de tipo: `feat:`, `bugfix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Histórico real. Nunca squash, nunca reescrever histórico publicado.
- Toda mensagem termina com uma linha: `IA: nenhuma`, `IA: parcial` ou `IA: majoritária`.
- Nunca adicionar `Co-Authored-By` (nem de IA). Autoria é declarada só pela linha `IA:`.
- Perguntar ao usuário o nível de IA antes de commitar.
