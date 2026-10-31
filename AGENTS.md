# AGENTS.md

## Contexto
Desafio técnico Fullstack Pleno: módulo de montagem de pedidos para vendedores externos que atendem pequenos varejistas, muitas vezes com internet ruim.

Stack: Vue 3 + Tailwind + shadcn (front, em `front-end/`), Node.js + TypeScript (back), PostgreSQL. Tudo deve subir com `docker compose up`.

## Documento principal
`Desafio Técnico — Fullstack Pleno.pdf` (raiz). Fonte da verdade para requisitos, regras de domínio e entregáveis. Consulte antes de decidir escopo.

## Dados
`seed.json` (raiz). Usar como está; contém imperfeições propositais de dados reais.
Coleções: `supervisores`, `vendedores`, `clientes`, `produtos`, `tabelas_preco`, `pedidos_historico`.
`preco_unidade` é preço de uma unidade (não da embalagem); `fator_embalagem` é unidades por embalagem.

## Commits
- Sempre iniciar o título com prefixo de tipo: `feat:`, `bugfix:`, `chore:`, `docs:`, `test:`, `refactor:`.
- Histórico real. Nunca squash, nunca reescrever histórico publicado.
- Toda mensagem termina com uma linha: `IA: nenhuma`, `IA: parcial` ou `IA: majoritária`.
- Nunca adicionar `Co-Authored-By` (nem de IA). Autoria é declarada só pela linha `IA:`.
- Perguntar ao usuário o nível de IA antes de commitar.
