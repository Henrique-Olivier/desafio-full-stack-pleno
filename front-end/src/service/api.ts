import { useVendedorSelecionadoStore } from '@/stores/vendedorSelecionado'
import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const { vendedor, isVendedorSelecionado } = useVendedorSelecionadoStore()
  if (isVendedorSelecionado) config.headers['X-Vendedor-Id'] = vendedor.id
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useVendedorSelecionadoStore().limparVendedor()
      window.location.assign('/')
    }
    return Promise.reject(error)
  },
)
