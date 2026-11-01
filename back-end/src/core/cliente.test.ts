import { test } from 'node:test'
import assert from 'node:assert/strict'
import { creditoDisponivelCentavos } from './cliente.js'

test('crédito disponível é o limite menos o utilizado', () => {
  assert.equal(creditoDisponivelCentavos(500000, 120000), 380000)
})

test('cliente com limite zero não tem crédito disponível', () => {
  assert.equal(creditoDisponivelCentavos(0, 0), 0)
})

test('crédito utilizado acima do limite não gera disponível negativo', () => {
  assert.equal(creditoDisponivelCentavos(10000, 15000), 0)
})
