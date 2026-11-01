import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ajustarDesconto, ajustarQuantidade, passoQuantidade, type ItemEmMontagem } from '@/lib/pedido'
import type { ProdutoDaTabela } from '@/types/produto'

const localStorageKey = 'pedidosEmMontagem'

const lerSalvos = (): Record<string, ItemEmMontagem[]> => {
  try {
    const salvos = JSON.parse(localStorage.getItem(localStorageKey) ?? '{}')
    return salvos && typeof salvos === 'object' && !Array.isArray(salvos) ? salvos : {}
  } catch {
    return {}
  }
}

export const usePedidoEmMontagemStore = defineStore('pedidoEmMontagem', () => {
  const rascunhos = ref<Record<string, ItemEmMontagem[]>>(lerSalvos())

  watch(rascunhos, (valor) => localStorage.setItem(localStorageKey, JSON.stringify(valor)), { deep: true })

  const itensDoCliente = (clienteId: string) => rascunhos.value[clienteId] ?? []

  const itemDoProduto = (clienteId: string, produtoId: string) =>
    itensDoCliente(clienteId).find((i) => i.produtoId === produtoId)

  const adicionar = (clienteId: string, produto: ProdutoDaTabela) => {
    if (!produto.ativo || itemDoProduto(clienteId, produto.id)) return
    rascunhos.value[clienteId] = [
      ...itensDoCliente(clienteId),
      { produtoId: produto.id, quantidade: passoQuantidade(produto), descontoPercentual: 0 },
    ]
  }

  const alterarQuantidade = (clienteId: string, produto: ProdutoDaTabela, quantidade: number) => {
    const item = itemDoProduto(clienteId, produto.id)
    if (item) item.quantidade = ajustarQuantidade(produto, quantidade)
  }

  const alterarDesconto = (clienteId: string, produtoId: string, desconto: number) => {
    const item = itemDoProduto(clienteId, produtoId)
    if (item) item.descontoPercentual = ajustarDesconto(desconto)
  }

  const remover = (clienteId: string, produtoId: string) => {
    rascunhos.value[clienteId] = itensDoCliente(clienteId).filter((i) => i.produtoId !== produtoId)
  }

  return { itensDoCliente, itemDoProduto, adicionar, alterarQuantidade, alterarDesconto, remover }
})
