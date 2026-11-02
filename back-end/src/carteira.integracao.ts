import { after, before, test } from 'node:test'
import assert from 'node:assert/strict'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { app } from './app.js'
import { db } from './db.js'

let servidor: Server
let baseUrl: string

before(async () => {
  servidor = await new Promise<Server>((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  baseUrl = `http://localhost:${(servidor.address() as AddressInfo).port}`
})

after(async () => {
  await new Promise((resolve) => servidor.close(resolve))
  await db.end()
})

const get = async (caminho: string, vendedorId?: string) => {
  const resposta = await fetch(baseUrl + caminho, { headers: vendedorId ? { 'X-Vendedor-Id': vendedorId } : {} })
  return { status: resposta.status, corpo: await resposta.json() }
}

test('lista de vendedores é pública', async () => {
  const { status, corpo } = await get('/vendedores')

  assert.equal(status, 200)
  assert.deepEqual(
    corpo.map((v: { id: string }) => v.id),
    ['V01', 'V03', 'V02'],
  )
})

test('rota da carteira sem vendedor responde 401', async () => {
  const { status } = await get('/carteira')

  assert.equal(status, 401)
})

test('vendedor inexistente responde 401', async () => {
  const { status } = await get('/carteira', 'V99')

  assert.equal(status, 401)
})

test('vendedor vê apenas os clientes da sua carteira', async () => {
  const { status, corpo } = await get('/carteira', 'V01')

  assert.equal(status, 200)
  assert.deepEqual(corpo.map((c: { id: string }) => c.id).sort(), ['C001', 'C002', 'C003', 'C004'])
})

test('detalhe de cliente da carteira responde 200', async () => {
  const { status, corpo } = await get('/carteira/C001', 'V01')

  assert.equal(status, 200)
  assert.equal(corpo.cliente.id, 'C001')
})

test('detalhe de cliente de outro vendedor responde 404', async () => {
  const { status } = await get('/carteira/C005', 'V01')

  assert.equal(status, 404)
})

test('produtos de cliente de outro vendedor respondem 404', async () => {
  const { status } = await get('/carteira/C005/produtos', 'V01')

  assert.equal(status, 404)
})

test('produtos vêm com o preço da tabela do cliente', async () => {
  const { corpo: daTabelaTP01 } = await get('/carteira/C001/produtos', 'V01')
  const { corpo: daTabelaTP02 } = await get('/carteira/C002/produtos', 'V01')

  const precoNaTP01 = daTabelaTP01.find((p: { id: string }) => p.id === 'P009').precoUnidade
  const precoNaTP02 = daTabelaTP02.find((p: { id: string }) => p.id === 'P009').precoUnidade
  assert.equal(precoNaTP01, 8.49)
  assert.notEqual(precoNaTP02, precoNaTP01)
})

test('cliente sem tabela de preço não tem produtos', async () => {
  const { status, corpo } = await get('/carteira/C004/produtos', 'V01')

  assert.equal(status, 200)
  assert.deepEqual(corpo, [])
})

test('produtos inativos aparecem por padrão e somem com apenasAtivos', async () => {
  const { corpo: todos } = await get('/carteira/C001/produtos', 'V01')
  const { corpo: ativos } = await get('/carteira/C001/produtos?apenasAtivos=true', 'V01')

  assert.ok(todos.some((p: { ativo: boolean }) => !p.ativo))
  assert.ok(ativos.every((p: { ativo: boolean }) => p.ativo))
  assert.ok(ativos.length < todos.length)
})

test('apenasAtivos com valor inválido responde 400', async () => {
  const { status } = await get('/carteira/C001/produtos?apenasAtivos=xpto', 'V01')

  assert.equal(status, 400)
})
