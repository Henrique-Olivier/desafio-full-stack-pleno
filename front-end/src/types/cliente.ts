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
