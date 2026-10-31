export type Produto = {
  id: string
  descricao: string
  categoria: string
  ativo: boolean
}

export const produtosAtivos = (produtos: Produto[]) => produtos.filter((p) => p.ativo)
