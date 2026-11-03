# Montagem de pedidos

Módulo de montagem de pedidos para vendedores externos que atendem pequenos varejistas. O vendedor escolhe um cliente da sua carteira, busca produtos por nome ou EAN com o preço da tabela do cliente, monta o pedido respeitando embalagem, desconto, pedido mínimo e crédito, e envia. Pedidos dentro da alçada de desconto ficam `Enviado`; acima dela, `Aguardando aprovação`.

Stack: Vue 3 + Tailwind + shadcn-vue no front, Node.js + TypeScript (Express) no back e PostgreSQL.

## Rodar com Docker (sobe tudo)

Pré-requisito: Docker com Docker Compose.

```bash
docker compose up
```

Esse comando sobe os três serviços, já com o build de produção (na primeira vez as imagens são construídas automaticamente):

| Serviço | Endereço | O que é |
|---|---|---|
| front | http://localhost:5173 | Build do Vite servido pelo nginx |
| back | http://localhost:3333 | API compilada com `tsc`, rodando com `node` |
| db | localhost:5432 | PostgreSQL 17, criado e populado a partir do `seed.json` na primeira subida |

Abra http://localhost:5173 e escolha um vendedor (o login é simulado).

O banco só é criado na primeira subida. Para recriar do zero (por exemplo, para apagar pedidos de teste):

```bash
docker compose down -v
docker compose up
```

Se alterar o código, use `docker compose up --build` para reconstruir as imagens; sem o `--build`, o compose reaproveita as imagens já construídas.

> Se você estiver rodando o projeto em modo dev ao mesmo tempo, pare o `npm run dev` do back e do front antes: o compose usa as mesmas portas (3333 e 5173).

## Rodar em modo dev

Pré-requisitos: Node.js 22.18+ ou 24+ e Docker (só para o banco).

1. Suba só o banco:

   ```bash
   docker compose up -d db
   ```

2. Back-end (http://localhost:3333, reinicia sozinho a cada alteração):

   ```bash
   cd back-end
   npm install
   npm run dev
   ```

3. Front-end (http://localhost:5173, com hot reload), em outro terminal:

   ```bash
   cd front-end
   cp .env.example .env
   npm install
   npm run dev
   ```

O `.env` do front só tem o endereço da API (`VITE_API_URL`). O back usa `postgres://postgres:postgres@localhost:5432/pedidos` por padrão; para outro banco, defina `DATABASE_URL`.

## Testes

| O que | Onde | Comando | Precisa do banco? |
|---|---|---|---|
| Regras de negócio (domínio) | `back-end/src/core/*.test.ts` | `npm test` | Não |
| Integração da API | `back-end/src/*.integracao.ts` | `npm run test:integracao` | Sim |
| Front (contas da prévia e pedido em montagem) | `front-end/src/**/__tests__/*.spec.ts` | `npm run test:unit -- --run` | Não |

```bash
cd back-end
npm test
docker compose up -d db
npm run test:integracao

cd ../front-end
npm run test:unit -- --run
```

- **Domínio:** as regras do pedido (mínimo de R$ 300, múltiplo de embalagem, produto inativo, desconto, alçada, crédito, arredondamento) são funções puras em `core/`, testadas sem banco e sem HTTP.
- **Integração:** sobe a API numa porta livre e chama as rotas de verdade contra o banco do Docker: carteira isolada por vendedor, preço da tabela do cliente, envio do pedido, reenvio sem duplicar e crédito descontando pedidos em aberto. Os pedidos criados pelos testes são apagados no final.
- **Front:** quantidade em múltiplos, desconto, busca por nome/EAN, avisos de mínimo, crédito e alçada, repetir pedido e o rascunho salvo no navegador.

## Casos do seed para testar na tela

O `seed.json` foi importado como está, com as imperfeições de dados reais:

- **C004** não tem tabela de preço: aparece na carteira, mas não pode receber pedido.
- **C002** tem só R$ 350,00 de crédito disponível, e **C010** (vendedor Paulo Andrade) não tem crédito.
- **P021** e **P022** estão inativos: aparecem na lista como "Indisponível".
- **P009** e **P023** têm o mesmo EAN: a busca por esse código mostra os dois.
- Produtos vendidos só em múltiplos (ex.: Açúcar, fardo com 10) só aceitam quantidades do fator.
- O histórico do C001 tem um pedido com o P022, útil para ver o "repetir pedido" deixando o item inativo de fora.

## O que ficou de fora

- **Montar o pedido sem conexão e sincronizar depois (requisito 9, opcional):** não implementei porque não tenho domínio suficiente do assunto. Preferi não entregar essa parte mal feita: mesmo com a ajuda da IA, eu não conseguiria avaliar de forma crítica o que fosse feito, e eu respondo por tudo que está no repositório.

  O que já existe ajuda nesse caminho: o id do pedido é gerado no front, então reenviar não duplica o pedido, e o rascunho fica salvo no aparelho. O que falta é guardar a carteira e as tabelas de preço no aparelho, ter uma fila de envio e, principalmente, decidir o que fazer quando o pedido montado offline é recusado na sincronização porque o preço mudou, o produto saiu ou o crédito acabou.

## Estrutura

```
back-end/
  db/          SQL de criação do banco e importação do seed.json
  src/core/    regras de negócio (funções puras + testes)
  src/features/ um arquivo por rota: validação, SQL e chamada ao core
front-end/
  src/pages/   telas (login, carteira, detalhe do cliente, novo pedido)
  src/lib/     contas da prévia do pedido
  src/stores/  vendedor selecionado e pedido em montagem (Pinia)
```

Decisões, premissas e uso de IA estão em [DECISIONS.md](DECISIONS.md), [ASSUMPTIONS.md](ASSUMPTIONS.md) e [AI_LOG.md](AI_LOG.md).
