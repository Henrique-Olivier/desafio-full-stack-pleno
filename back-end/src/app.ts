import express from 'express'
import cors from 'cors'
import { listarVendedoresRouter } from './features/listar-vendedores.js'
import { autenticarVendedor } from './autenticacao.js'
import { listarCarteiraRouter } from './features/listar-carteira.js'
import { detalharClienteRouter } from './features/detalhar-cliente.js'
import { listarProdutosRouter } from './features/listar-produtos.js'
import { enviarPedidoRouter } from './features/enviar-pedido.js'

export const app = express()

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use(listarVendedoresRouter)

app.use(autenticarVendedor)
app.use(listarCarteiraRouter)
app.use(detalharClienteRouter)
app.use(listarProdutosRouter)
app.use(enviarPedidoRouter)

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ erro: 'Deu ruim' })
})
