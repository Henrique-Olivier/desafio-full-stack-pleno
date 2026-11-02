# Premissas

## Imperfeições do seed

O PDF pede para usar o `seed.json` como está. Por isso importei os dados sem corrigir nada: as imperfeições do seed estão no banco do mesmo jeito que vieram no arquivo.

O schema foi feito para aceitar esses dados, e o tratamento de cada caso fica no código (regras no `core/` e avisos na tela), não no banco.

## Produtos inativos

O PDF não fala de produto inativo. O seed traz o campo `ativo`, e alguns produtos vêm como `false`. Interpretei que produto inativo não pode ser vendido, mas continua aparecendo na lista do pedido, desabilitado e com o selo "Indisponível". Assim o vendedor entende que o produto existe e só não está à venda, em vez de achar que ele sumiu do catálogo.

## Desconto por produto

O PDF diz que o vendedor pode aplicar desconto, mas não diz se é no pedido inteiro ou em cada item. Interpretei que o desconto é por produto: cada item do pedido tem o seu percentual. É o mesmo formato do histórico do seed, que traz `desconto_percentual` em cada item. Se algum item passar da alçada do vendedor, o pedido inteiro vai para aprovação do supervisor.

## Crédito estourado bloqueia o envio

O PDF pede para "respeitar o limite de crédito disponível", mas não diz se o pedido acima do crédito é bloqueado ou vai para aprovação. Interpretei que bloqueia: um pedido com total acima do crédito disponível não pode ser enviado. No PDF, a aprovação do supervisor está ligada só ao desconto acima da alçada; liberar crédito é outra decisão, que não é do supervisor de vendas.

## Login simulado

O PDF diz que o login pode ser simulado escolhendo o vendedor. Interpretei que não há autenticação: o vendedor é escolhido numa lista e o id dele vai no header `X-Vendedor-Id` de cada requisição.
