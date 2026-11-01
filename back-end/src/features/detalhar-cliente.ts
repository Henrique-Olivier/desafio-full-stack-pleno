import { Router } from 'express'
import { db } from '../db.js'
import { creditoDisponivelCentavos, type Cliente } from '../core/cliente.js'

type ItemPedido = {
  produtoId: string
  descricao: string
  quantidade: number
  precoUnidade: number
  descontoPercentual: number
  subtotal: number
}

type ResumoPedido = {
  id: string
  criadoEm: string
  status: string
  quantidadeItens: number
  total: number
  itens: ItemPedido[]
}

const paraCentavos = (reais: number) => Math.round(reais * 100)

export const detalharClienteRouter = Router()

detalharClienteRouter.get('/carteira/:clienteId', async (req, res) => {
  const { rows: clientes } = await db.query<Cliente>(
    `SELECT id,
            nome_fantasia AS "nomeFantasia",
            razao_social AS "razaoSocial",
            cnpj,
            tabela_preco_id AS "tabelaPrecoId",
            limite_credito::float AS "limiteCredito",
            credito_utilizado::float AS "creditoUtilizado",
            cidade,
            uf
       FROM clientes
      WHERE id = $1 AND vendedor_id = $2`,
    [req.params.clienteId, req.vendedor.id],
  )
  const cliente = clientes[0]
  if (!cliente) return res.status(404).json({ erro: 'Cliente não encontrado na carteira' })

  const { rows: pedidos } = await db.query<ResumoPedido>(
    `SELECT p.id,
            p.criado_em AS "criadoEm",
            p.status,
            COUNT(i.produto_id)::int AS "quantidadeItens",
            COALESCE(ROUND(SUM(i.quantidade * i.preco_unidade * (1 - i.desconto_percentual / 100)), 2), 0)::float AS total,
            COALESCE(
              json_agg(
                json_build_object(
                  'produtoId', i.produto_id,
                  'descricao', pr.descricao,
                  'quantidade', i.quantidade,
                  'precoUnidade', i.preco_unidade::float,
                  'descontoPercentual', i.desconto_percentual::float,
                  'subtotal', ROUND(i.quantidade * i.preco_unidade * (1 - i.desconto_percentual / 100), 2)::float
                ) ORDER BY pr.descricao
              ) FILTER (WHERE i.produto_id IS NOT NULL),
              '[]'
            ) AS itens
       FROM pedidos p
       LEFT JOIN pedido_itens i ON i.pedido_id = p.id
       LEFT JOIN produtos pr ON pr.id = i.produto_id
      WHERE p.cliente_id = $1
      GROUP BY p.id
      ORDER BY p.criado_em DESC
      LIMIT 10`,
    [cliente.id],
  )

  const creditoDisponivel =
    creditoDisponivelCentavos(paraCentavos(cliente.limiteCredito), paraCentavos(cliente.creditoUtilizado)) / 100

  res.json({ cliente: { ...cliente, creditoDisponivel }, pedidos })
})
