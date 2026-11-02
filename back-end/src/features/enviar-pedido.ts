import { Router } from 'express'
import { z } from 'zod'
import type { PoolClient } from 'pg'
import { db } from '../db.js'
import { creditoDisponivelCentavos } from '../core/cliente.js'
import { avaliarPedido, type ItemPedido, type Problema, type StatusPedido } from '../core/pedido.js'
import type { Produto } from '../core/produto.js'

const Corpo = z.object({
  id: z.uuid(),
  clienteId: z.string().min(1),
  itens: z.array(
    z.object({
      produtoId: z.string().min(1),
      quantidade: z.number(),
      descontoPercentual: z.number(),
    }),
  ),
})

type ClienteDoPedido = {
  tabelaPrecoId: string | null
  limiteCredito: number
  creditoUtilizado: number
  creditoEmAberto: number
}

type ProdutoComPreco = Pick<Produto, 'id' | 'fatorEmbalagem' | 'vendaSomenteMultiplo' | 'ativo'> & { precoUnidade: number }

type PedidoGravado = { id: string; status: StatusPedido; total: number }

const paraCentavos = (reais: number) => Math.round(reais * 100)

const buscarPedido = async (conexao: PoolClient, id: string, vendedorId: string) => {
  const { rows } = await conexao.query<PedidoGravado & { vendedorId: string }>(
    `SELECT p.id,
            p.status,
            p.vendedor_id AS "vendedorId",
            COALESCE(SUM(ROUND(i.quantidade * i.preco_unidade * (1 - i.desconto_percentual / 100), 2)), 0)::float AS total
       FROM pedidos p
       LEFT JOIN pedido_itens i ON i.pedido_id = p.id
      WHERE p.id = $1
      GROUP BY p.id`,
    [id],
  )
  const pedido = rows[0]
  if (!pedido) return null
  if (pedido.vendedorId !== vendedorId) return 'deOutroVendedor' as const
  return { id: pedido.id, status: pedido.status, total: pedido.total }
}

export const enviarPedidoRouter = Router()

enviarPedidoRouter.post('/pedidos', async (req, res) => {
  const corpo = Corpo.safeParse(req.body)
  if (!corpo.success) return res.status(400).json({ erro: corpo.error.issues })
  const pedido = corpo.data
  const vendedor = req.vendedor

  const conexao = await db.connect()
  try {
    await conexao.query('BEGIN')

    const jaGravado = await buscarPedido(conexao, pedido.id, vendedor.id)
    if (jaGravado === 'deOutroVendedor') {
      await conexao.query('ROLLBACK')
      return res.status(409).json({ erro: 'Id de pedido já usado' })
    }
    if (jaGravado) {
      await conexao.query('ROLLBACK')
      return res.status(200).json(jaGravado)
    }

    const { rows: clientes } = await conexao.query<ClienteDoPedido>(
      `SELECT tabela_preco_id AS "tabelaPrecoId",
              limite_credito::float AS "limiteCredito",
              credito_utilizado::float AS "creditoUtilizado",
              (SELECT COALESCE(SUM(ROUND(i.quantidade * i.preco_unidade * (1 - i.desconto_percentual / 100), 2)), 0)
                 FROM pedidos p
                 JOIN pedido_itens i ON i.pedido_id = p.id
                WHERE p.cliente_id = clientes.id
                  AND p.status IN ('Enviado', 'AguardandoAprovacao'))::float AS "creditoEmAberto"
         FROM clientes
        WHERE id = $1 AND vendedor_id = $2
          FOR UPDATE`,
      [pedido.clienteId, vendedor.id],
    )
    const cliente = clientes[0]
    if (!cliente) {
      await conexao.query('ROLLBACK')
      return res.status(404).json({ erro: 'Cliente não encontrado na carteira' })
    }
    if (!cliente.tabelaPrecoId) {
      await conexao.query('ROLLBACK')
      return res.status(422).json({ problemas: [{ codigo: 'ClienteSemTabela' }] satisfies Problema[] })
    }

    const { rows: produtos } = await conexao.query<ProdutoComPreco>(
      `SELECT p.id,
              p.fator_embalagem AS "fatorEmbalagem",
              p.venda_somente_multiplo AS "vendaSomenteMultiplo",
              p.ativo,
              i.preco_unidade::float AS "precoUnidade"
         FROM tabela_preco_itens i
         JOIN produtos p ON p.id = i.produto_id
        WHERE i.tabela_preco_id = $1
          AND i.produto_id = ANY($2::text[])`,
      [cliente.tabelaPrecoId, pedido.itens.map((item) => item.produtoId)],
    )
    const produtosPorId = new Map(produtos.map((p) => [p.id, p]))

    const foraDaTabela: Problema[] = []
    const itens: ItemPedido[] = []
    for (const item of pedido.itens) {
      const produto = produtosPorId.get(item.produtoId)
      if (!produto) {
        foraDaTabela.push({ codigo: 'ProdutoForaDaTabela', produtoId: item.produtoId })
        continue
      }
      const { precoUnidade, ...regras } = produto
      itens.push({
        produto: regras,
        precoUnidadeCentavos: paraCentavos(precoUnidade),
        quantidade: item.quantidade,
        descontoPercentual: item.descontoPercentual,
      })
    }

    const avaliacao = avaliarPedido({
      itens,
      alcadaDescontoPercentual: vendedor.alcadaDescontoPercentual,
      creditoDisponivelCentavos: creditoDisponivelCentavos(
        paraCentavos(cliente.limiteCredito),
        paraCentavos(cliente.creditoUtilizado),
        paraCentavos(cliente.creditoEmAberto),
      ),
    })
    const problemas = [...foraDaTabela, ...avaliacao.problemas]
    if (problemas.length > 0) {
      await conexao.query('ROLLBACK')
      return res.status(422).json({ problemas })
    }

    await conexao.query(
      `INSERT INTO pedidos (id, cliente_id, vendedor_id, status)
       VALUES ($1, $2, $3, $4)`,
      [pedido.id, pedido.clienteId, vendedor.id, avaliacao.status],
    )
    await conexao.query(
      `INSERT INTO pedido_itens (pedido_id, produto_id, quantidade, preco_unidade, desconto_percentual)
       SELECT $1, *
         FROM unnest($2::text[], $3::int[], $4::numeric[], $5::numeric[])`,
      [
        pedido.id,
        itens.map((item) => item.produto.id),
        itens.map((item) => item.quantidade),
        itens.map((item) => (item.precoUnidadeCentavos / 100).toFixed(2)),
        itens.map((item) => item.descontoPercentual),
      ],
    )
    await conexao.query('COMMIT')

    res.status(201).json({ id: pedido.id, status: avaliacao.status, total: avaliacao.totalCentavos / 100 })
  } catch (erro) {
    await conexao.query('ROLLBACK')
    if ((erro as { code?: string }).code === '23505') {
      const gravado = await buscarPedido(conexao, pedido.id, vendedor.id)
      if (gravado && gravado !== 'deOutroVendedor') return res.status(200).json(gravado)
    }
    throw erro
  } finally {
    conexao.release()
  }
})
