# AI_LOG

## 1. Como guardar dinheiro no banco (discordei da IA)

**O que pedi**
Perguntei por que o schema que a IA propôs guardava os valores em centavos (`preco_unidade_centavos integer`, R$ 26,90 como `2690`).

**O que a IA respondeu**
Explicou que o `number` do JavaScript é ponto flutuante e erra em casas decimais (`0.1 + 0.2 = 0.30000000000000004`), o que poderia, por exemplo, bloquear um pedido de R$ 300,00 por causa de um `299.99999`. Reconheceu que no Postgres o `numeric` também é exato e apresentou duas opções:
- A) `integer` em centavos no banco.
- B) `numeric(12,2)` no banco e centavos só no código.

A IA recomendou a A, para o valor já sair do banco pronto para conta.

**O que decidi**
Discordei e fiquei com a B. O `numeric` é o tipo mais adequado para dinheiro no banco, deixa os valores legíveis direto no SQL e o `seed.json` entra como está, sem converter para centavos no import.

Aceitei o alerta sobre o float no JavaScript: a conversão para centavos acontece em `features/` ao ler do banco, antes de chegar no `core/`. Assim as contas das regras continuam exatas.

## 2. Vendedor dentro de `core/carteira.ts` (a IA errou)

**O que pedi**
Pedi para a IA criar o primeiro endpoint, a listagem de vendedores para o login simulado.

**O que a IA respondeu**
Criou o tipo `Vendedor` dentro de `core/carteira.ts`, seguindo uma divisão de domínios que ela mesma tinha proposto antes: `carteira` agrupando vendedores e clientes, porque o PDF define carteira como o conjunto de clientes de um vendedor.

**O que decidi**
Questionei por que o vendedor estava em "carteira". Não fazia sentido: quem abre `carteira.ts` espera encontrar a carteira, não o vendedor. Isso ia contra a minha própria decisão de nomes, que tem como ponto principal evitar ambiguidade.

Mudei para um arquivo por conceito (`vendedor.ts`, `cliente.ts`, `catalogo.ts`, `pedido.ts`). A carteira passa a ficar dentro de `vendedor.ts`, porque o vendedor tem uma carteira de clientes, e não o contrário. Registrei essa regra de dependência no `AGENTS.md`.

## 3. Dinheiro em centavos na API (discordei da IA)

**O que pedi**
Pedi ajuda para terminar a listagem da carteira de clientes.

**O que a IA respondeu**
Seguindo a regra de converter dinheiro para centavos, sugeriu que a API já devolvesse `limiteCreditoCentavos` (R$ 6.000,00 virando `600000`) e que o front dividisse por 100 para mostrar.

**O que decidi**
Achei confuso. A listagem não faz conta nenhuma, só mostra valores, e ler `600000` na resposta da API não ajuda ninguém. Mudei para a API devolver em reais (`limite_credito::float AS "limiteCredito"`). Os centavos ficam só dentro do back, quando o `core/` precisar fazer conta (total do pedido, mínimo, crédito). Atualizei a regra no `AGENTS.md`.

## 4. Tela de login carregando para sempre

**O que pedi**
A tela de login ficou em "Carregando vendedores..." infinito depois que mudei a store para guardar o vendedor no `localStorage`. Pedi para a IA verificar.

**O que a IA respondeu**
Abriu a tela no navegador e leu o console: o `localStorage` tinha `"V01"`, salvo por uma versão anterior da store, e o `JSON.parse` quebrava. O erro estava num `onMounted` dentro da store, que impedia o `onMounted` da tela de rodar, então a requisição nem saía.

**O que decidi**
Tirei o `onMounted` da store (store não é componente) e passei a ler o `localStorage` direto na criação, com `try/catch` para um valor inválido não travar o app de novo.

## 5. `core/catalogo.ts` (a IA errou de novo no nome)

**O que pedi**
Pedi para a IA criar o tipo completo do produto.

**O que a IA respondeu**
Completou o tipo `Produto` dentro de `core/catalogo.ts`, o arquivo de exemplo que ela mesma tinha criado no scaffold, com o nome tirado do PDF ("consulta o catálogo").

**O que decidi**
Perguntei por que "catálogo". Era o mesmo problema da carteira: os outros arquivos do `core/` são entidades (`vendedor.ts`, `cliente.ts`, `pedido.ts`), e catálogo é um agrupamento. Quem procura o tipo `Produto` não abre `catalogo.ts` primeiro. Renomeei para `core/produto.ts` e atualizei o `AGENTS.md` e o `DECISIONS.md`.

## Mapa de autoria

| Parte | Autoria |
|---|---|
| Modelagem | Feita em conjunto: eu comecei, a IA terminou e eu revisei. |
| Login simulado (back: `/vendedores` e middleware do header) | IA escreveu a partir das minhas decisões; eu revisei. |
| Tela de login | IA criou a página; eu fiz a store, o service e a seleção do vendedor. |
| Carteira (back) | Eu escrevi; a IA revisou, apontou os bugs (aspas no `$1`, header errado, rota) e eu corrigi. |
| Carteira (front) | Eu montei a tela com a tabela do shadcn; a IA fez o `formatarDinheiro`, a guarda de rota e o tratamento de 401. |
| Layout (sidebar retrátil, header mobile e menu do vendedor) | IA fez a partir do que eu descrevi (comportamento no desktop e no mobile, iniciais no avatar, sidebar encolhendo para ícones); eu revisei. |
| Responsividade da carteira e do login | IA fez (cards no mobile, tabela a partir de telas grandes); eu escolhi a abordagem e revisei. |
| Detalhe do cliente (back e front) | Eu desenhei a tela (informações em cima, histórico embaixo, botão de novo pedido) e propus um endpoint único; a IA sugeriu a rota `/carteira/:clienteId`, trocar a lista da tabela de preço por um selo, e escreveu back, front e o teste do crédito disponível. Pedi o card do pedido expansível com os itens; eu revisei. |
