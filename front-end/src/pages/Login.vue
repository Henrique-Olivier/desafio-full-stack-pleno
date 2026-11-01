<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
import { api } from '@/service/api'
import { useVendedorSelecionadoStore } from '@/stores/vendedorSelecionado'
import { useRouter } from 'vue-router'
import type { Vendedor } from '@/types/vendedor'

const router = useRouter()
const vendedorStore = useVendedorSelecionadoStore()
const vendedores = ref<Vendedor[]>([])
const carregando = ref(true)
const erro = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get<Vendedor[]>('/vendedores')
    vendedores.value = data
  } catch {
    erro.value = true
  } finally {
    carregando.value = false
  }
})

function handleClickVendedor(vendedor: Vendedor) {
  vendedorStore.selecionarVendedor(vendedor)
  router.push('/carteira')
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 p-4">
    <h1 class="text-2xl font-semibold">Selecione um vendedor</h1>

    <p v-if="carregando" class="text-muted-foreground">Carregando vendedores...</p>
    <p v-else-if="erro" class="text-destructive">Não foi possível carregar os vendedores.</p>

    <ul v-else class="flex flex-col gap-2">
      <li v-for="vendedor in vendedores" :key="vendedor.id">
        <Button
          variant="outline"
          size="lg"
          class="w-full justify-start"
          @click="handleClickVendedor(vendedor)"
        >
          {{ vendedor.nome }} 
        </Button>
      </li>
    </ul>
  </main>
</template>
