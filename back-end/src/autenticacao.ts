import type { NextFunction, Request, Response } from 'express'
import { z } from 'zod'
import { db } from './db.js'
import type { Vendedor } from './core/vendedor.js'

declare global {
  namespace Express {
    interface Request {
      vendedor: Vendedor
    }
  }
}

const Header = z.string().min(1)

export async function autenticarVendedor(req: Request, res: Response, next: NextFunction) {
  const vendedorId = Header.safeParse(req.header('X-Vendedor-Id'))
  if (!vendedorId.success) return res.status(401).json({ erro: 'Header X-Vendedor-Id obrigatório' })

  const { rows } = await db.query<Vendedor>(
    `SELECT id, nome, alcada_desconto_percentual::float AS "alcadaDescontoPercentual"
       FROM vendedores
      WHERE id = $1`,
    [vendedorId.data],
  )
  if (rows.length === 0) return res.status(401).json({ erro: 'Vendedor não encontrado' })

  req.vendedor = rows[0]
  next()
}
