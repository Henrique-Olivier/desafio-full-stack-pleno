// src/main.ts
import express from 'express'
import cors from 'cors'
import { listarProdutosRouter } from './features/listar-produtos.js'  // .js mesmo

const app = express()

app.use(cors({ origin: 'http://localhost:5173' })) // front Vue
app.use(express.json()) // ler body JSON

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

app.use(listarProdutosRouter)

// erro geral — sempre por último, 4 parâmetro
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(500).json({ erro: 'Deu ruim' })
})

const PORT = Number(process.env.PORT) || 3333
app.listen(PORT, () => console.log(`Rodando em http://localhost:${PORT}`))