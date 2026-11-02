import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ajustarDesconto, ajustarQuantidade, passoQuantidade, type ItemEmMontagem } from '@/lib/pedido'
import type { ProdutoDaTabela } from '@/types/produto'

const localStorageKey = 'pedidosEmMontagem'

export type Rascunho = { id: string; itens: ItemEmMontagem[] }

const lerSalvos = (): Record<string, Rascunho> => {
  try {
    const salvos = JSON.parse(localStorage.getItem(localStorageKey) ?? '{}')
    if (!salvos || typeof salvos !== 'object' || Array.isArray(salvos)) return {}
    return Object.fromEntries(
      Object.entries(salvos).map(([clienteId, rascunho]) => [
        clienteId,
        Array.isArray(rascunho) ? { id: crypto.randomUUID(), itens: rascunho } : rascunho,
      ]),
    ) as Record<string, Rascunho>
  } catch {
    return {}
  }
}

export const usePedidoEmMontagemStore = defineStore('pedidoEmMontagem', () => {
  const rascunhos = ref<Record<string, Rascunho>>(lerSalvos())

  watch(rascunhos, (valor) => localStorage.setItem(localStorageKey, JSON.stringify(valor)), { deep: true })

  const itensDoCliente = (clienteId: string) => rascunhos.value[clienteId]?.itens ?? []

  const idDoPedido = (clienteId: string) => rascunhos.value[clienteId]?.id

  const copiaDoRascunho = (clienteId: string): Rascunho | undefined => {
    const rascunho = rascunhos.value[clienteId]
    return rascunho && { id: rascunho.id, itens: rascunho.itens.map((item) => ({ ...item })) }
  }

  const itemDoProduto = (clienteId: string, produtoId: string) =>
    itensDoCliente(clienteId).find((i) => i.produtoId === produtoId)

  const adicionar = (clienteId: string, produto: ProdutoDaTabela) => {
    if (!produto.ativo || itemDoProduto(clienteId, produto.id)) return
    rascunhos.value[clienteId] = {
      id: idDoPedido(clienteId) ?? crypto.randomUUID(),
      itens: [
        ...itensDoCliente(clienteId),
        { produtoId: produto.id, quantidade: passoQuantidade(produto), descontoPercentual: 0 },
      ],
    }
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
    const rascunho = rascunhos.value[clienteId]
    if (rascunho) rascunho.itens = rascunho.itens.filter((i) => i.produtoId !== produtoId)
  }

  const substituir = (clienteId: string, itens: ItemEmMontagem[]) => {
    rascunhos.value[clienteId] = { id: idDoPedido(clienteId) ?? crypto.randomUUID(), itens }
  }

  const restaurar = (clienteId: string, rascunho: Rascunho | undefined) => {
    if (rascunho) rascunhos.value[clienteId] = rascunho
    else delete rascunhos.value[clienteId]
  }

  const limpar = (clienteId: string) => {
    delete rascunhos.value[clienteId]
  }

  return {
    itensDoCliente,
    idDoPedido,
    copiaDoRascunho,
    itemDoProduto,
    adicionar,
    alterarQuantidade,
    alterarDesconto,
    remover,
    substituir,
    restaurar,
    limpar,
  }
})
