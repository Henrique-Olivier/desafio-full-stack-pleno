// src/main.ts
import express from 'express'
import cors from 'cors'
import { listarProdutosRouter } from './features/listar-produtos.js'  // .js mesmo
import { listarVendedoresRouter } from './features/listar-vendedores.js'
import { autenticarVendedor } from './autenticacao.js'
import { listarCarteiraRouter } from './features/listar-carteira.js'

const app = express()

app.use(cors({ origin: 'http://localhost:5173' })) // front Vue
app.use(express.json()) // ler body JSON

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use(listarVendedoresRouter)

app.use(autenticarVendedor)
app.use(listarProdutosRouter)
app.use(listarCarteiraRouter)

// erro geral — sempre por último, 4 parâmetro
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ erro: 'Deu ruim' })
})

const PORT = Number(process.env.PORT) || 3333
app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`))