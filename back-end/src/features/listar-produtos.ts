import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { produtosAtivos, type Produto } from '../core/produto.js'

type ProdutoComPreco = Produto & { precoUnidade: number }

const Query = z.object({ apenasAtivos: z.stringbool().default(false) })

export const listarProdutosRouter = Router()

listarProdutosRouter.get('/carteira/:clienteId/produtos', async (req, res) => {
  const query = Query.safeParse(req.query)
  if (!query.success) return res.status(400).json({ erro: query.error.issues })

  const { rows: clientes } = await db.query<{ tabelaPrecoId: string | null }>(
    `SELECT tabela_preco_id AS "tabelaPrecoId"
       FROM clientes
      WHERE id = $1 AND vendedor_id = $2`,
    [req.params.clienteId, req.vendedor.id],
  )
  if (clientes.length === 0) return res.status(404).json({ erro: 'Cliente não encontrado' })

  const { rows } = await db.query<ProdutoComPreco>(
    `SELECT p.id,
            p.sku,
            p.ean,
            p.descricao,
            p.categoria,
            p.marca,
            p.unidade_venda AS "unidadeVenda",
            p.fator_embalagem AS "fatorEmbalagem",
            p.venda_somente_multiplo AS "vendaSomenteMultiplo",
            p.ativo,
            i.preco_unidade::float AS "precoUnidade"
       FROM tabela_preco_itens i
       JOIN produtos p ON p.id = i.produto_id
      WHERE i.tabela_preco_id = $1
      ORDER BY p.descricao`,
    [clientes[0].tabelaPrecoId],
  )

  res.json(query.data.apenasAtivos ? produtosAtivos(rows) : rows)
})
