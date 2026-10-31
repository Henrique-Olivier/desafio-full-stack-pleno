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

## Mapa de autoria

| Parte | Autoria |
|---|---|
| Modelagem | Feita em conjunto: eu comecei, a IA terminou e eu revisei. |
