import express from 'express'
import cors from 'cors'
import { listarVendedoresRouter } from './features/listar-vendedores.js'
import { autenticarVendedor } from './autenticacao.js'
import { listarCarteiraRouter } from './features/listar-carteira.js'
import { detalharClienteRouter } from './features/detalhar-cliente.js'
import { listarProdutosRouter } from './features/listar-produtos.js'

export const app = express()

app.use(cors({ origin: 'http://localhost:5173' })) // front Vue
app.use(express.json()) // ler body JSON

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use(listarVendedoresRouter)

app.use(autenticarVendedor)
app.use(listarCarteiraRouter)
app.use(detalharClienteRouter)
app.use(listarProdutosRouter)

// erro geral — sempre por último, 4 parâmetro
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ erro: 'Deu ruim' })
})
