import { test } from 'node:test'
import assert from 'node:assert/strict'
import { creditoDisponivelCentavos } from './cliente.js'

test('crédito disponível é o limite menos o utilizado', () => {
  assert.equal(creditoDisponivelCentavos(500000, 120000, 0), 380000)
})

test('cliente com limite zero não tem crédito disponível', () => {
  assert.equal(creditoDisponivelCentavos(0, 0, 0), 0)
})

test('crédito utilizado acima do limite não gera disponível negativo', () => {
  assert.equal(creditoDisponivelCentavos(10000, 15000, 0), 0)
})

test('pedidos em aberto do cliente reduzem o crédito disponível', () => {
  assert.equal(creditoDisponivelCentavos(500000, 120000, 50000), 330000)
})

test('pedidos em aberto acima do disponível não geram disponível negativo', () => {
  assert.equal(creditoDisponivelCentavos(500000, 120000, 400000), 0)
})
