import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { app } from './app.js'
import { db } from './db.js'

let servidor: Server
let baseUrl: string
const idsCriados: string[] = []

before(async () => {
  servidor = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  baseUrl = `http://localhost:${(servidor.address() as AddressInfo).port}`
})

after(async () => {
  await db.query('DELETE FROM pedido_itens WHERE pedido_id = ANY($1)', [idsCriados])
  await db.query('DELETE FROM pedidos WHERE id = ANY($1)', [idsCriados])
  await new Promise((resolve) => servidor.close(resolve))
  await db.end()
})

type Item = { produtoId: string; quantidade: number; descontoPercentual?: number }

const enviar = async (vendedorId: string, clienteId: string, itens: Item[], id: string = randomUUID()) => {
  idsCriados.push(id)
  const resposta = await fetch(`${baseUrl}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Vendedor-Id': vendedorId },
    body: JSON.stringify({
      id,
      clienteId,
      itens: itens.map((item) => ({ descontoPercentual: 0, ...item })),
    }),
  })
  return { id, status: resposta.status, corpo: await resposta.json() }
}

const pedidoGravado = async (id: string) => (await db.query('SELECT id FROM pedidos WHERE id = $1', [id])).rowCount

const creditoDisponivel = async (clienteId: string, vendedorId: string) => {
  const resposta = await fetch(`${baseUrl}/carteira/${clienteId}`, { headers: { 'X-Vendedor-Id': vendedorId } })
  return (await resposta.json()).cliente.creditoDisponivel
}

test('pedido dentro da alçada é gravado como Enviado com o preço da tabela', async () => {
  const { id, status, corpo } = await enviar('V01', 'C001', [{ produtoId: 'P001', quantidade: 12 }])

  assert.equal(status, 201)
  assert.deepEqual(corpo, { id, status: 'Enviado', total: 322.8 })
})

test('pedido com desconto acima da alçada fica Aguardando aprovação', async () => {
  const { status, corpo } = await enviar('V01', 'C001', [{ produtoId: 'P001', quantidade: 20, descontoPercentual: 10 }])

  assert.equal(status, 201)
  assert.equal(corpo.status, 'AguardandoAprovacao')
  assert.equal(corpo.total, 484.2)
})

test('reenviar o mesmo pedido não grava de novo e devolve o pedido gravado', async () => {
  const primeiro = await enviar('V01', 'C001', [{ produtoId: 'P001', quantidade: 12 }])

  const reenvio = await enviar('V01', 'C001', [{ produtoId: 'P001', quantidade: 12 }], primeiro.id)

  assert.equal(reenvio.status, 200)
  assert.deepEqual(reenvio.corpo, primeiro.corpo)
})

test('pedido abaixo do mínimo responde 422 e não é gravado', async () => {
  const { id, status, corpo } = await enviar('V01', 'C001', [{ produtoId: 'P001', quantidade: 1 }])

  assert.equal(status, 422)
  assert.deepEqual(corpo.problemas, [{ codigo: 'AbaixoDoMinimo' }])
  assert.equal(await pedidoGravado(id), 0)
})

test('quantidade fora do múltiplo da embalagem responde 422', async () => {
  const { status, corpo } = await enviar('V01', 'C001', [
    { produtoId: 'P003', quantidade: 15 },
    { produtoId: 'P001', quantidade: 12 },
  ])

  assert.equal(status, 422)
  assert.deepEqual(corpo.problemas, [{ codigo: 'ForaDoMultiplo', produtoId: 'P003' }])
})

test('produto inativo responde 422', async () => {
  const { status, corpo } = await enviar('V01', 'C001', [
    { produtoId: 'P021', quantidade: 6 },
    { produtoId: 'P001', quantidade: 12 },
  ])

  assert.equal(status, 422)
  assert.deepEqual(corpo.problemas, [{ codigo: 'ProdutoInativo', produtoId: 'P021' }])
})

test('produto fora da tabela do cliente responde 422', async () => {
  const { status, corpo } = await enviar('V02', 'C007', [
    { produtoId: 'P021', quantidade: 6 },
    { produtoId: 'P001', quantidade: 12 },
  ])

  assert.equal(status, 422)
  assert.deepEqual(corpo.problemas, [{ codigo: 'ProdutoForaDaTabela', produtoId: 'P021' }])
})

test('cliente sem tabela de preço responde 422', async () => {
  const { status, corpo } = await enviar('V01', 'C004', [{ produtoId: 'P001', quantidade: 12 }])

  assert.equal(status, 422)
  assert.deepEqual(corpo.problemas, [{ codigo: 'ClienteSemTabela' }])
})

test('cliente de outro vendedor responde 404', async () => {
  const { status } = await enviar('V01', 'C005', [{ produtoId: 'P001', quantidade: 12 }])

  assert.equal(status, 404)
})

test('pedido com id inválido responde 400', async () => {
  const { status } = await enviar('V01', 'C001', [{ produtoId: 'P001', quantidade: 12 }], 'nao-e-uuid')

  assert.equal(status, 400)
})

test('pedido acima do crédito disponível responde 422', async () => {
  const { status, corpo } = await enviar('V03', 'C010', [{ produtoId: 'P001', quantidade: 12 }])

  assert.equal(status, 422)
  assert.deepEqual(corpo.problemas, [{ codigo: 'CreditoInsuficiente' }])
})

test('pedidos em aberto reduzem o crédito disponível do cliente', async () => {
  const antes = await creditoDisponivel('C002', 'V01')

  const primeiro = await enviar('V01', 'C002', [{ produtoId: 'P001', quantidade: 12 }])
  const depois = await creditoDisponivel('C002', 'V01')
  const segundo = await enviar('V01', 'C002', [{ produtoId: 'P001', quantidade: 12 }])

  assert.equal(primeiro.status, 201)
  assert.equal(Math.round((antes - depois) * 100), Math.round(primeiro.corpo.total * 100))
  assert.equal(segundo.status, 422)
  assert.deepEqual(segundo.corpo.problemas, [{ codigo: 'CreditoInsuficiente' }])
})
