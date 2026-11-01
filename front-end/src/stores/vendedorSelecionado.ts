import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { Vendedor } from '@/types/vendedor'

export const useVendedorSelecionadoStore = defineStore('vendedorSelecionado', () => {
  const vendedor = ref<Vendedor>({ id: '', nome: '', alcadaDescontoPercentual: 0 })
  const localStorageKey = 'vendedorSelecionado'
  const storedVendedor = localStorage.getItem(localStorageKey)

  if (storedVendedor) {
    let parsedVendedor = null
    try {
      parsedVendedor = JSON.parse(storedVendedor)
    } catch (error) {
      console.error('Erro ao analisar o vendedor armazenado no localStorage:', error)
    }

    if (parsedVendedor && typeof parsedVendedor === 'object' && 'id' in parsedVendedor && 'nome' in parsedVendedor && 'alcadaDescontoPercentual' in parsedVendedor) {
      vendedor.value = parsedVendedor as Vendedor
    }
  }

  const selecionarVendedor = (vendedorSelecionado: Vendedor) => {
    vendedor.value = { ...vendedorSelecionado }
    localStorage.setItem(localStorageKey, JSON.stringify(vendedorSelecionado))
  }

  const limparVendedor = () => {
    vendedor.value = { id: '', nome: '', alcadaDescontoPercentual: 0 }
    localStorage.removeItem(localStorageKey)
  }

  const isVendedorSelecionado = computed(() => {
    return !!vendedor.value.id && !!vendedor.value.nome
  })

  return { vendedor, selecionarVendedor, limparVendedor, isVendedorSelecionado }
})
