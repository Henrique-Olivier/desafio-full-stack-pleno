import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/pages/Login.vue'
import CarteiraDeClientes from '@/pages/CarteiraDeClientes.vue'
import { useVendedorSelecionadoStore } from '@/stores/vendedorSelecionado'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'login', component: Login },
    { path: '/carteira', name: 'carteira', component: CarteiraDeClientes },
  ],
})

router.beforeEach((to) => {
  const vendedorStore = useVendedorSelecionadoStore()
  if (to.name !== 'login' && !vendedorStore.isVendedorSelecionado) return { name: 'login' }
})

export default router
