import { Router } from 'express'
import { db } from '../db.js'
import type { Vendedor } from '../core/vendedor.js'

export const listarVendedoresRouter = Router()

listarVendedoresRouter.get('/vendedores', async (_req, res) => {
  const { rows } = await db.query<Vendedor>(
    `SELECT id, nome, alcada_desconto_percentual::float AS "alcadaDescontoPercentual"
       FROM vendedores
      ORDER BY nome`,
  )

  res.json(rows)
})
