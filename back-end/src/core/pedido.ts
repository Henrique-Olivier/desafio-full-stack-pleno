import type { Produto } from './produto.js'

export const PEDIDO_MINIMO_CENTAVOS = 30_000

export type StatusPedido = 'Faturado' | 'Cancelado' | 'Enviado' | 'AguardandoAprovacao'

export type ItemPedido = {
  produto: Pick<Produto, 'id' | 'fatorEmbalagem' | 'vendaSomenteMultiplo' | 'ativo'>
  precoUnidadeCentavos: number
  quantidade: number
  descontoPercentual: number
}

export type Problema =
  | { codigo: 'PedidoVazio' | 'AbaixoDoMinimo' | 'CreditoInsuficiente' }
  | {
      codigo: 'QuantidadeInvalida' | 'ForaDoMultiplo' | 'ProdutoInativo' | 'DescontoInvalido' | 'ProdutoDuplicado'
      produtoId: string
    }

export type AvaliacaoPedido = {
  totalCentavos: number
  status: Extract<StatusPedido, 'Enviado' | 'AguardandoAprovacao'>
  problemas: Problema[]
}

export const subtotalCentavos = (item: Pick<ItemPedido, 'precoUnidadeCentavos' | 'quantidade' | 'descontoPercentual'>) => {
  const descontoEmCentesimos = Math.round(item.descontoPercentual * 100)
  return Math.round((item.quantidade * item.precoUnidadeCentavos * (10_000 - descontoEmCentesimos)) / 10_000)
}

const problemasDoItem = (item: ItemPedido): Problema[] => {
  const produtoId = item.produto.id
  const problemas: Problema[] = []
  if (!Number.isInteger(item.quantidade) || item.quantidade <= 0) problemas.push({ codigo: 'QuantidadeInvalida', produtoId })
  else if (item.produto.vendaSomenteMultiplo && item.quantidade % item.produto.fatorEmbalagem !== 0)
    problemas.push({ codigo: 'ForaDoMultiplo', produtoId })
  if (!item.produto.ativo) problemas.push({ codigo: 'ProdutoInativo', produtoId })
  if (!Number.isFinite(item.descontoPercentual) || item.descontoPercentual < 0 || item.descontoPercentual > 100)
    problemas.push({ codigo: 'DescontoInvalido', produtoId })
  return problemas
}

export const avaliarPedido = (pedido: {
  itens: ItemPedido[]
  alcadaDescontoPercentual: number
  creditoDisponivelCentavos: number
}): AvaliacaoPedido => {
  const { itens, alcadaDescontoPercentual, creditoDisponivelCentavos } = pedido
  const totalCentavos = itens.reduce((soma, item) => soma + subtotalCentavos(item), 0)
  const status: AvaliacaoPedido['status'] = itens.some((item) => item.descontoPercentual > alcadaDescontoPercentual)
    ? 'AguardandoAprovacao'
    : 'Enviado'

  if (itens.length === 0) return { totalCentavos, status, problemas: [{ codigo: 'PedidoVazio' }] }

  const problemas = itens.flatMap(problemasDoItem)
  const vistos = new Set<string>()
  for (const item of itens) {
    if (vistos.has(item.produto.id)) problemas.push({ codigo: 'ProdutoDuplicado', produtoId: item.produto.id })
    vistos.add(item.produto.id)
  }
  if (totalCentavos < PEDIDO_MINIMO_CENTAVOS) problemas.push({ codigo: 'AbaixoDoMinimo' })
  if (totalCentavos > creditoDisponivelCentavos) problemas.push({ codigo: 'CreditoInsuficiente' })

  return { totalCentavos, status, problemas }
}
