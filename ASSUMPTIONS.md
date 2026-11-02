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

## Cliente sem tabela de preço

O PDF diz que cada cliente está vinculado a uma tabela, mas no seed o C004 vem sem tabela. Interpretei isso como erro de cadastro: o cliente aparece na carteira, mas não pode receber pedido até ter uma tabela vinculada. A tela mostra o aviso e o botão de novo pedido fica desabilitado, e o back recusa o envio com `ClienteSemTabela`.

Considerei usar a "Tabela Padrão" (TP01) como alternativa, mas não fiz: preço é decisão comercial, o fallback esconderia o erro de cadastro e o seed não diz qual tabela é a padrão (eu teria que supor pelo nome).

## Repetir pedido

O PDF pede a opção "repetir pedido", mas não diz o que acontece com preço, desconto e produtos que mudaram. Interpretei assim:
- Os itens voltam com a mesma quantidade, mas com o preço atual da tabela do cliente. O preço do pedido antigo fica só no histórico.
- O desconto volta zerado: desconto é negociado em cada visita, e repetir um desconto antigo poderia mandar o pedido para aprovação sem o vendedor perceber.
- Produto inativo ou que saiu da tabela do cliente fica de fora, com um aviso dizendo quais itens não entraram.
- Se o fator de embalagem mudou, a quantidade é ajustada ao múltiplo atual.
- Ao tentar sair da tela com um pedido repetido, uma confirmação pergunta se ele vira rascunho ou é descartado. Descartar volta o pedido que estava em montagem antes (ou nenhum). Enviar o pedido não pede confirmação. Fora da repetição, o pedido em montagem continua salvo como rascunho, sem perguntar nada.

## Login simulado

O PDF diz que o login pode ser simulado escolhendo o vendedor. Interpretei que não há autenticação: o vendedor é escolhido numa lista e o id dele vai no header `X-Vendedor-Id` de cada requisição.
