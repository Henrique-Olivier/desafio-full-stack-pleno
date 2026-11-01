export type Cliente = {
  id: string
  nomeFantasia: string
  razaoSocial: string
  cnpj: string
  tabelaPrecoId: string | null
  limiteCredito: number
  creditoUtilizado: number
  cidade: string | null
  uf: string | null
}

export type ItemPedido = {
  produtoId: string
  descricao: string
  quantidade: number
  precoUnidade: number
  descontoPercentual: number
  subtotal: number
}

export type ResumoPedido = {
  id: string
  criadoEm: string
  status: 'Faturado' | 'Cancelado' | 'Enviado' | 'AguardandoAprovacao'
  quantidadeItens: number
  total: number
  itens: ItemPedido[]
}

export type DetalheCliente = {
  cliente: Cliente & { creditoDisponivel: number }
  pedidos: ResumoPedido[]
}
