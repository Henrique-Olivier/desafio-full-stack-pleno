import { test } from 'node:test'
import assert from 'node:assert/strict'
import { produtosAtivos } from './produto.js'

test('produto inativo não aparece', () => {
  const produtos = [
    { id: 'P1', descricao: 'Arroz', categoria: 'mercearia', ativo: true },
    { id: 'P2', descricao: 'Refrigerante', categoria: 'bebidas', ativo: false },
  ]
  assert.deepEqual(produtosAtivos(produtos).map((p) => p.id), ['P1'])
})
