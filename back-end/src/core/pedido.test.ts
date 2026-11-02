import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avaliarPedido, subtotalCentavos, type ItemPedido } from './pedido.js'

type SobrescreverItem = Partial<Omit<ItemPedido, 'produto'>> & { produto?: Partial<ItemPedido['produto']> }

const umItem = (sobrescrever: SobrescreverItem = {}): ItemPedido => ({
  precoUnidadeCentavos: 50_000,
  quantidade: 1,
  descontoPercentual: 0,
  ...sobrescrever,
  produto: { id: 'P1', fatorEmbalagem: 1, vendaSomenteMultiplo: false, ativo: true, ...sobrescrever.produto },
})

const avaliar = (itens: ItemPedido[], contexto: { alcadaDescontoPercentual?: number; creditoDisponivelCentavos?: number } = {}) =>
  avaliarPedido({ itens, alcadaDescontoPercentual: 5, creditoDisponivelCentavos: 1_000_000, ...contexto })

test('pedido válido dentro da alçada fica Enviado', () => {
  const resultado = avaliar([umItem({ quantidade: 2, descontoPercentual: 3 })])

  assert.deepEqual(resultado, { totalCentavos: 97_000, status: 'Enviado', problemas: [] })
})

test('pedido sem itens não pode ser enviado', () => {
  const resultado = avaliar([])

  assert.deepEqual(resultado.problemas, [{ codigo: 'PedidoVazio' }])
})

test('pedido abaixo de R$ 300,00 não pode ser enviado', () => {
  const resultado = avaliar([umItem({ precoUnidadeCentavos: 29_999 })])

  assert.deepEqual(resultado.problemas, [{ codigo: 'AbaixoDoMinimo' }])
})

test('pedido de exatamente R$ 300,00 pode ser enviado', () => {
  const resultado = avaliar([umItem({ precoUnidadeCentavos: 30_000 })])

  assert.deepEqual(resultado.problemas, [])
})

test('quantidade zero é inválida', () => {
  const resultado = avaliar([umItem({ quantidade: 0 }), umItem({ produto: { id: 'P2' } })])

  assert.deepEqual(resultado.problemas, [{ codigo: 'QuantidadeInvalida', produtoId: 'P1' }])
})

test('quantidade negativa é inválida', () => {
  const resultado = avaliar([umItem({ quantidade: -1 }), umItem({ precoUnidadeCentavos: 100_000, produto: { id: 'P2' } })])

  assert.deepEqual(resultado.problemas, [{ codigo: 'QuantidadeInvalida', produtoId: 'P1' }])
})

test('quantidade fracionada é inválida', () => {
  const resultado = avaliar([umItem({ quantidade: 1.5 })])

  assert.deepEqual(resultado.problemas, [{ codigo: 'QuantidadeInvalida', produtoId: 'P1' }])
})

test('produto vendido só em múltiplo recusa quantidade fora do fator', () => {
  const resultado = avaliar([
    umItem({ precoUnidadeCentavos: 3_000, quantidade: 15, produto: { fatorEmbalagem: 10, vendaSomenteMultiplo: true } }),
  ])

  assert.deepEqual(resultado.problemas, [{ codigo: 'ForaDoMultiplo', produtoId: 'P1' }])
})

test('produto vendido só em múltiplo aceita quantidade múltipla do fator', () => {
  const resultado = avaliar([
    umItem({ precoUnidadeCentavos: 1_500, quantidade: 20, produto: { fatorEmbalagem: 10, vendaSomenteMultiplo: true } }),
  ])

  assert.deepEqual(resultado.problemas, [])
})

test('produto com embalagem mas sem obrigação de múltiplo aceita unidade avulsa', () => {
  const resultado = avaliar([
    umItem({ precoUnidadeCentavos: 10_000, quantidade: 5, produto: { fatorEmbalagem: 12, vendaSomenteMultiplo: false } }),
  ])

  assert.deepEqual(resultado.problemas, [])
})

test('produto inativo não pode ser vendido', () => {
  const resultado = avaliar([umItem({ produto: { ativo: false } })])

  assert.deepEqual(resultado.problemas, [{ codigo: 'ProdutoInativo', produtoId: 'P1' }])
})

test('desconto acima de 100% é inválido', () => {
  const resultado = avaliar([umItem({ descontoPercentual: 101 }), umItem({ produto: { id: 'P2' } })])

  assert.deepEqual(resultado.problemas, [{ codigo: 'DescontoInvalido', produtoId: 'P1' }])
})

test('desconto negativo é inválido', () => {
  const resultado = avaliar([umItem({ descontoPercentual: -1 })])

  assert.deepEqual(resultado.problemas, [{ codigo: 'DescontoInvalido', produtoId: 'P1' }])
})

test('subtotal do item arredonda meio centavo para cima', () => {
  assert.equal(subtotalCentavos({ precoUnidadeCentavos: 849, quantidade: 1, descontoPercentual: 5 }), 807)
})

test('subtotal aceita desconto com casas decimais', () => {
  assert.equal(subtotalCentavos({ precoUnidadeCentavos: 1_000, quantidade: 3, descontoPercentual: 2.5 }), 2_925)
})

test('total do pedido soma os subtotais já arredondados', () => {
  const resultado = avaliar([
    umItem({ precoUnidadeCentavos: 849, descontoPercentual: 5 }),
    umItem({ precoUnidadeCentavos: 849, descontoPercentual: 5, produto: { id: 'P2' } }),
  ])

  assert.equal(resultado.totalCentavos, 1_614)
})

test('desconto acima da alçada manda o pedido para aprovação', () => {
  const resultado = avaliar([umItem({ descontoPercentual: 6 })], { alcadaDescontoPercentual: 5 })

  assert.equal(resultado.status, 'AguardandoAprovacao')
  assert.deepEqual(resultado.problemas, [])
})

test('desconto igual à alçada fica Enviado', () => {
  const resultado = avaliar([umItem({ descontoPercentual: 5 })], { alcadaDescontoPercentual: 5 })

  assert.equal(resultado.status, 'Enviado')
})

test('basta um item acima da alçada para o pedido ir para aprovação', () => {
  const resultado = avaliar([umItem(), umItem({ descontoPercentual: 7, produto: { id: 'P2' } })], {
    alcadaDescontoPercentual: 5,
  })

  assert.equal(resultado.status, 'AguardandoAprovacao')
})

test('total acima do crédito disponível não pode ser enviado', () => {
  const resultado = avaliar([umItem()], { creditoDisponivelCentavos: 49_999 })

  assert.deepEqual(resultado.problemas, [{ codigo: 'CreditoInsuficiente' }])
})

test('total igual ao crédito disponível pode ser enviado', () => {
  const resultado = avaliar([umItem()], { creditoDisponivelCentavos: 50_000 })

  assert.deepEqual(resultado.problemas, [])
})

test('mesmo produto duas vezes no pedido é recusado', () => {
  const resultado = avaliar([umItem(), umItem()])

  assert.deepEqual(resultado.problemas, [{ codigo: 'ProdutoDuplicado', produtoId: 'P1' }])
})

test('todos os problemas voltam juntos', () => {
  const resultado = avaliar([umItem({ precoUnidadeCentavos: 1_000, produto: { ativo: false } })], {
    creditoDisponivelCentavos: 0,
  })

  assert.deepEqual(resultado.problemas, [
    { codigo: 'ProdutoInativo', produtoId: 'P1' },
    { codigo: 'AbaixoDoMinimo' },
    { codigo: 'CreditoInsuficiente' },
  ])
})
