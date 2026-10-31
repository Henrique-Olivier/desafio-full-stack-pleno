# Decisões

## Front-end: Vue 3 + Tailwind + shadcn-vue

**Contexto**
Preciso montar as telas de carteira, catálogo e pedido num prazo curto. O time usa Vue 3, que é a stack recomendada no desafio.

**Alternativas**
- CSS próprio: controle total, mas gasta muito tempo com estilização.
- Biblioteca de componentes completa (Vuetify, PrimeVue): muitos componentes prontos, mas visual mais difícil de customizar e mais peso no projeto.
- Tailwind + shadcn-vue: componentes prontos que ficam dentro do projeto, estilizados com Tailwind.

**Escolha**
Vue 3 + Tailwind + shadcn-vue.

**Por quê**
- Usar os componentes prontos do shadcn e a estilização simplificada do Tailwind vai me poupar tempo com estilização.
- Com isso, foco mais na regra de negócio e na entrega de valor da plataforma.
- A manutenção é simplificada: o código dos componentes fica no projeto, então dá pra ajustar sem depender da biblioteca.

**O que faria diferente com mais tempo**
Criaria um conjunto de componentes próprios do domínio (item do pedido, resumo de totais).

## Arquitetura do back-end: Vertical Slices + Functional Core

**Contexto**
O sistema tem poucas telas, mas as regras de negócio são todas cálculo: pedido mínimo, múltiplo de embalagem, alçada de desconto e limite de crédito. O prazo é curto e eu preciso conseguir explicar e alterar o código ao vivo.

**Alternativas**
- MVC: rápido de começar, mas a regra acaba espalhada entre controller e model e fica difícil de testar.
- Clean Architecture com camadas e interfaces (ports/adapters): bem organizada, mas cria muitos arquivos e interfaces que nesse projeto eu não ia usar.
- Vertical Slices + Functional Core: as regras ficam em funções puras numa pasta `core/`, e cada funcionalidade é um arquivo em `features/` que busca os dados, chama o core e responde.

**Escolha**
Vertical Slices + Functional Core.

```
back-end/src/
  core/        # regras de negócio: só funções puras, sem Express e sem banco
  features/    # um arquivo por funcionalidade (rota + busca de dados + chamada ao core)
  main.ts      # sobe o Express e registra as features
```

Exemplo já implementado: `features/listar-produtos.ts` busca no banco e usa `produtosAtivos()` de `core/catalogo.ts`, testado em `core/catalogo.test.ts`.

Regras que vou seguir:
- Regra de negócio só no `core/`.
- Erro de regra volta como lista de problemas, não como exceção, pra tela mostrar tudo de uma vez.
- Dinheiro em `numeric` no banco e em centavos nas contas do código. Quantidade sempre em unidades.
- O back recalcula preço e total, nunca confia no que vem do front.

**Por quê**
- A curva de aprendizado é menor: cada feature se lê de cima pra baixo.
- Função pura é fácil de testar, não precisa de mock.
- O `core/` é TypeScript puro, então dá pra reaproveitar no front e no modo offline.
- Menos código de estrutura, mais tempo pra regra de negócio e testes.

**Pontos fracos**
- Pra testar uma feature inteira preciso do banco rodando (o docker compose já resolve).
- Se trocar de banco, tenho que reescrever as queries das features.
- Exige disciplina pra não deixar regra vazar pro `features/`.

**O que faria diferente com mais tempo**
Se o sistema crescesse, criaria interfaces pros repositórios (mais próximo da Clean Architecture) e transformaria o `core/` num pacote compartilhado entre front e back.

## Acesso ao banco: `pg` com SQL puro, sem ORM

**Contexto**
Preciso conectar o back no PostgreSQL, criar as tabelas e carregar o `seed.json`.

**Alternativas**
- Prisma: muito usado, mas pesado, gera código e esconde o SQL.
- Drizzle: schema em TypeScript e migrations prontas, mas ainda é quase um ORM e tem mais configuração.
- Kysely: SQL tipado sem ORM, mas é mais uma API pra aprender.
- `pg` com SQL puro.

**Escolha**
`pg` com SQL escrito à mão. As tabelas e o seed ficam em arquivos `.sql` em `back-end/db/`, que o próprio Postgres roda na primeira vez que o container sobe (`docker-entrypoint-initdb.d`). O seed lê o `seed.json` direto no SQL, sem script em Node. Para validar a entrada das rotas uso `zod`.

**Por quê**
- Não escolhi um ORM porque facilita a curva de aprendizado: é só SQL, que eu já conheço.
- Fica fácil visualizar o que está sendo feito: a query está ali na feature, sem nada escondido.
- Combina com a arquitetura: o banco fica só em `features/` e o `core/` continua puro.
- Menos dependências e nenhuma lib de migration.

**Pontos fracos**
- Tenho que tipar o resultado das queries na mão.
- Os `.sql` só rodam com o volume do banco vazio. Se mudar o schema, preciso rodar `docker compose down -v`.

**O que faria diferente com mais tempo**
Usaria uma ferramenta de migration de verdade, para conseguir evoluir o schema sem apagar os dados, e talvez o Kysely, para ter as queries tipadas.

## Nomes de tabelas, colunas e código em português

**Contexto**
Precisei decidir se o banco e o código usariam nomes em português ou em inglês. Tomei o PDF como a fonte do negócio (os conceitos e a linguagem do domínio) e o `seed.json` como a parte técnica (a estrutura dos dados).

**Alternativas**
- Inglês: é o padrão mais comum na indústria, mas exige traduzir os termos do negócio.
- Português: a mesma linguagem do PDF e do seed.

**Escolha**
Português, sem acento e sem `ç` nos identificadores (`alcada`, `preco`, `descricao`). Banco em `snake_case` e código em `camelCase`. Termos técnicos consagrados, como `id` e `status`, continuam em inglês.

**Por quê**
- O ponto principal é evitar ambiguidade. Termos como "alçada" e "carteira" não têm uma tradução óbvia (`approval_limit`? `portfolio`? `wallet`?). Cada tradução seria uma decisão a mais e uma chance de interpretar errado.
- Sigo a ideia de linguagem ubíqua do DDD: o negócio é a fonte da verdade, e o código e o banco usam as mesmas palavras que o negócio usa.
- O seed já vem em português, então os dados entram no banco sem nenhum mapeamento de nomes.
- Quem lê o código, o PDF ou o banco encontra o mesmo termo nos três lugares.

**O que faria diferente com mais tempo**
Nada nesse ponto. Só mudaria para inglês se o time ou o restante do codebase da empresa já usasse inglês.

## Modelagem do banco

Diagrama: https://dbdiagram.io/d/desafio-pl-6ae60acf8bf38111a8f5985c

**Contexto**
Precisei transformar o `seed.json` em tabelas, mantendo os dados como estão e deixando espaço para os pedidos novos criados pelo app.

**Alternativas e escolhas**
- **Ids:** usar os ids do seed (`V01`, `C001`, `P001`) como `TEXT` ou gerar ids numéricos. Fiquei com os do seed: as relações já batem, o SQL do import fica curto e o mesmo id aparece no arquivo, no banco e na tela. Ids numéricos exigiriam uma coluna extra com o código e um join em cada insert.
- **Vendedor e supervisor:** uma tabela `users` com role ou tabelas separadas. Separei, porque eles têm dados diferentes (só o vendedor tem alçada) e a carteira do cliente precisa apontar só para vendedor. O login é simulado.
- **Dinheiro:** `numeric(12,2)`, exato no banco e legível. O seed entra sem conversão.
- **Status do pedido:** `ENUM` com `Faturado` e `Cancelado` (do seed) e `Enviado` e `AguardandoAprovacao` (do PDF). Assim o banco não aceita status inválido.
- **Histórico e pedidos novos na mesma tabela `pedidos`:** o "repetir pedido" lê de um lugar só.
- **Preço congelado no item do pedido:** se a tabela de preço mudar, o pedido antigo continua com o valor da época.
- **Desconto por item:** segui o histórico do seed, que traz `desconto_percentual` em cada item.
- **Totais não são gravados:** são calculados a partir dos itens, então não existe valor duplicado que possa divergir.

**Por quê**
Manter o modelo próximo do seed e do PDF, evitar ambiguidade e deixar o banco garantir o que der (PK, FK, enum).

**O que faria diferente com mais tempo**
Não criei índices de performance, porque o volume do seed é mínimo. 
## Id do pedido gerado pelo front

**Contexto**
O vendedor trabalha com internet ruim. Pode acontecer de o pedido ser gravado no servidor, a resposta se perder e o app tentar enviar de novo.

**Alternativas**
- Servidor gera o id (`SERIAL` ou `gen_random_uuid()`): mais simples, mas cada reenvio vira um pedido novo, duplicado no banco.
- Front gera o id (`crypto.randomUUID()`) e manda junto com o pedido.

**Escolha**
O front gera o id do pedido. O back valida o formato com `z.uuid()` e grava com `INSERT ... ON CONFLICT (id) DO NOTHING`.

Se o pedido foi criado, o back responde `201`. Se o id já existia, responde `200` com o pedido que está gravado, e o front mostra que ele já tinha sido enviado. Não usei `409`, porque na prática o id repetido é um reenvio por conexão ruim, e o vendedor veria um erro de um pedido que deu certo.

**Por quê**
- O mesmo pedido não pode ser cadastrado de novo no banco: se o app reenviar, o id já existe e nada é gravado outra vez.
- O pedido já nasce com id, o que prepara o terreno para montar pedido offline e sincronizar depois.
- Preço, total e status continuam sendo calculados pelo back. O front só escolhe o id.
- `pedidos.id` é `TEXT`, então convive com os ids do histórico do seed (`PH001`).

**O que faria diferente com mais tempo**
Adicionaria um número curto e amigável para mostrar ao cliente, já que o UUID é longo para exibir na tela.
