import { Router } from 'express'
import { db } from '../db.js'
import type { Cliente } from '../core/cliente.js'

export const listarCarteiraRouter = Router()

listarCarteiraRouter.get('/carteira', async (req, res) => {
    const idVendedor = req.vendedor.id

    const { rows } = await db.query<Cliente>(
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
      WHERE vendedor_id = $1
      ORDER BY nome_fantasia`,
        [idVendedor]
    )

    res.json(rows)
})
