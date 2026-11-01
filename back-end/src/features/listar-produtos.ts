import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db.js'
import { produtosAtivos, type Produto } from '../core/produto.js'

const Query = z.object({ categoria: z.string().optional() })

export const listarProdutosRouter = Router()

// GET /produtos  ou  GET /produtos?categoria=bebidas
listarProdutosRouter.get('/produtos', async (req, res) => {
  const query = Query.safeParse(req.query)
  if (!query.success) return res.status(400).json({ erro: query.error.issues })

  const { rows } = await db.query<Produto>(
    `SELECT id, descricao, categoria, ativo
       FROM produtos
      WHERE $1::text IS NULL OR categoria = $1
      ORDER BY descricao`,
    [query.data.categoria ?? null],
  )

  res.json(produtosAtivos(rows))
})
