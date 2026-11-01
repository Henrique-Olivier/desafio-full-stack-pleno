export type Produto = {
  id: string
  sku: string
  ean: string
  descricao: string
  categoria: string
  marca: string
  unidadeVenda: string
  fatorEmbalagem: number
  vendaSomenteMultiplo: boolean
  ativo: boolean
}

export const produtosAtivos = <T extends Pick<Produto, 'ativo'>>(produtos: T[]) => produtos.filter((p) => p.ativo)
