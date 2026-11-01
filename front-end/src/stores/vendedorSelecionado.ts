import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useVendedorSelecionadoStore = defineStore('vendedorSelecionado', () => {
  const vendedorId = ref('')
  const selecionarVendedor = (id: string) => {
    vendedorId.value = id
  }

  return { vendedorId, selecionarVendedor }
})
