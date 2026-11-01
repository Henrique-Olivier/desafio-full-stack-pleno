import type { ProdutoDaTabela } from '@/types/produto'

export type ItemEmMontagem = {
  produtoId: string
  quantidade: number
  descontoPercentual: number
}

export const PEDIDO_MINIMO = 300

type RegraDeQuantidade = Pick<ProdutoDaTabela, 'fatorEmbalagem' | 'vendaSomenteMultiplo'>

export const passoQuantidade = (produto: RegraDeQuantidade) =>
  produto.vendaSomenteMultiplo ? produto.fatorEmbalagem : 1

export const ajustarQuantidade = (produto: RegraDeQuantidade, quantidade: number) => {
  const passo = passoQuantidade(produto)
  return Math.max(passo, Math.round(quantidade / passo) * passo)
}

export const ajustarDesconto = (desconto: number) =>
  Number.isFinite(desconto) ? Math.min(100, Math.max(0, desconto)) : 0

export const subtotalCentavos = (precoUnidade: number, item: ItemEmMontagem) =>
  Math.round(item.quantidade * precoUnidade * (100 - item.descontoPercentual))

export const descreverEmbalagem = (produto: ProdutoDaTabela, quantidade: number) =>
  produto.fatorEmbalagem > 1 && quantidade % produto.fatorEmbalagem === 0
    ? `${quantidade / produto.fatorEmbalagem} ${produto.unidadeVenda}`
    : ''

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

export const buscarProdutos = (produtos: ProdutoDaTabela[], termo: string) => {
  const busca = normalizar(termo)
  if (!busca) return produtos
  if (/^\d+$/.test(busca)) return produtos.filter((p) => p.ean === busca)
  return produtos.filter((p) => normalizar(p.descricao).includes(busca))
}
