# Premissas

## Imperfeições do seed

O PDF pede para usar o `seed.json` como está. Por isso importei os dados sem corrigir nada: as imperfeições do seed estão no banco do mesmo jeito que vieram no arquivo.

O schema foi feito para aceitar esses dados, e o tratamento de cada caso fica no código (regras no `core/` e avisos na tela), não no banco.

## Login simulado

O PDF diz que o login pode ser simulado escolhendo o vendedor. Interpretei que não há autenticação: o vendedor é escolhido numa lista e o id dele vai no header `X-Vendedor-Id` de cada requisição.
