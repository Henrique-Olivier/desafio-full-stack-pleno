export type ProdutoDaTabela = {
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
  precoUnidade: number
}
