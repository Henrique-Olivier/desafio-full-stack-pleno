import { formatarDinheiro } from '@/lib/utils'
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

export const quantidadeNoCampo = (produto: RegraDeQuantidade, unidades: number) =>
  unidades / passoQuantidade(produto)

export const unidadesDoCampo = (produto: RegraDeQuantidade, valorDigitado: number) =>
  valorDigitado * passoQuantidade(produto)

export const ajustarDesconto = (desconto: number) =>
  Number.isFinite(desconto) ? Math.min(100, Math.max(0, desconto)) : 0

export const subtotalCentavos = (precoUnidade: number, item: ItemEmMontagem) =>
  Math.round(
    (item.quantidade * Math.round(precoUnidade * 100) * (10_000 - Math.round(item.descontoPercentual * 100))) / 10_000,
  )

export const descreverEmbalagem = (produto: ProdutoDaTabela, quantidade: number) =>
  produto.fatorEmbalagem > 1 && quantidade % produto.fatorEmbalagem === 0
    ? `${quantidade / produto.fatorEmbalagem} ${produto.unidadeVenda}`
    : ''

export const problemasDoPedido = (pedido: {
  total: number
  creditoDisponivel: number
  temProdutoIndisponivel: boolean
}) => {
  const problemas: string[] = []
  if (pedido.temProdutoIndisponivel) problemas.push('Remova os produtos indisponíveis.')
  if (pedido.total < PEDIDO_MINIMO)
    problemas.push(
      `Pedido mínimo de ${formatarDinheiro(PEDIDO_MINIMO)}. Faltam ${formatarDinheiro(PEDIDO_MINIMO - pedido.total)}.`,
    )
  if (pedido.total > pedido.creditoDisponivel)
    problemas.push(`Total acima do crédito disponível (${formatarDinheiro(pedido.creditoDisponivel)}).`)
  return problemas
}

export const itensParaRepetir = (
  itensAntigos: { produtoId: string; descricao: string; quantidade: number }[],
  produtos: ProdutoDaTabela[],
) => {
  const itens: ItemEmMontagem[] = []
  const deFora: string[] = []
  for (const antigo of itensAntigos) {
    const produto = produtos.find((p) => p.id === antigo.produtoId)
    if (!produto) deFora.push(`${antigo.descricao} (fora da tabela)`)
    else if (!produto.ativo) deFora.push(`${antigo.descricao} (indisponível)`)
    else
      itens.push({
        produtoId: produto.id,
        quantidade: ajustarQuantidade(produto, antigo.quantidade),
        descontoPercentual: 0,
      })
  }
  return { itens, deFora }
}

export type ProblemaDoServidor = { codigo: string; produtoId?: string }

const mensagensDoPedido: Record<string, string> = {
  PedidoVazio: 'O pedido não tem itens.',
  AbaixoDoMinimo: `Pedido abaixo do mínimo de ${formatarDinheiro(PEDIDO_MINIMO)}.`,
  CreditoInsuficiente: 'Total acima do crédito disponível do cliente.',
  ClienteSemTabela: 'Cliente sem tabela de preço.',
}

const mensagensDoItem: Record<string, string> = {
  QuantidadeInvalida: 'quantidade inválida',
  ForaDoMultiplo: 'quantidade fora do múltiplo da embalagem',
  ProdutoInativo: 'produto indisponível',
  DescontoInvalido: 'desconto inválido',
  ProdutoDuplicado: 'produto repetido no pedido',
  ProdutoForaDaTabela: 'produto fora da tabela do cliente',
}

export const mensagemDoProblema = (problema: ProblemaDoServidor, descricaoDoProduto: (id: string) => string | undefined) => {
  if (problema.produtoId && mensagensDoItem[problema.codigo])
    return `${descricaoDoProduto(problema.produtoId) ?? problema.produtoId}: ${mensagensDoItem[problema.codigo]}.`
  return mensagensDoPedido[problema.codigo] ?? 'Pedido recusado.'
}

export const excedeAlcada = (descontos: number[], alcada: number) => descontos.some((desconto) => desconto > alcada)

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

export const buscarProdutos = (produtos: ProdutoDaTabela[], termo: string) => {
  const busca = normalizar(termo)
  if (!busca) return produtos
  if (/^\d+$/.test(busca)) return produtos.filter((p) => p.ean === busca)
  return produtos.filter((p) => normalizar(p.descricao).includes(busca))
}
