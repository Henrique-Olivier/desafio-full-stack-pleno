<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, ChevronDown, TriangleAlert } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { api } from '@/service/api'
import { formatarData, formatarDinheiro } from '@/lib/utils'
import type { DetalheCliente, ResumoPedido } from '@/types/cliente'

const rotulosStatus: Record<ResumoPedido['status'], string> = {
  Faturado: 'Faturado',
  Cancelado: 'Cancelado',
  Enviado: 'Enviado',
  AguardandoAprovacao: 'Aguardando aprovação',
}

const route = useRoute()
const detalhe = ref<DetalheCliente | null>(null)
const carregando = ref(true)
const erro = ref('')

onMounted(async () => {
  try {
    const { data } = await api.get<DetalheCliente>(`/carteira/${route.params.clienteId}`)
    detalhe.value = data
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } }).response?.status
    erro.value =
      status === 404 ? 'Cliente não encontrado na sua carteira.' : 'Não foi possível carregar o cliente.'
  } finally {
    carregando.value = false
  }
})
</script>

<template>
  <div class="flex flex-col gap-6 pb-24 md:pb-0">
    <RouterLink
      :to="{ name: 'carteira' }"
      class="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
    >
      <ArrowLeft class="size-4" />
      Carteira
    </RouterLink>

    <p v-if="carregando" class="text-muted-foreground">Carregando cliente...</p>
    <p v-else-if="erro" class="text-destructive">{{ erro }}</p>

    <template v-else-if="detalhe">
      <header class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div class="flex flex-col gap-1">
          <h1 class="text-2xl font-semibold">{{ detalhe.cliente.nomeFantasia }}</h1>
          <p class="text-muted-foreground text-sm">
            {{ detalhe.cliente.razaoSocial }} · {{ detalhe.cliente.cnpj }}
          </p>
          <p class="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
            <span v-if="detalhe.cliente.cidade">{{ detalhe.cliente.cidade }}/{{ detalhe.cliente.uf }}</span>
            <span v-if="detalhe.cliente.tabelaPrecoId" class="rounded-md border px-2 py-0.5 text-xs">
              Tabela {{ detalhe.cliente.tabelaPrecoId }}
            </span>
          </p>
        </div>

        <div
          class="bg-background fixed inset-x-0 bottom-0 z-10 border-t p-4 md:static md:border-0 md:bg-transparent md:p-0"
        >
          <Button v-if="!detalhe.cliente.tabelaPrecoId" size="lg" class="w-full md:w-auto" disabled>
            Novo pedido
          </Button>
          <Button v-else as-child size="lg" class="w-full md:w-auto">
            <RouterLink :to="{ name: 'novo-pedido', params: { clienteId: detalhe.cliente.id } }">Novo pedido</RouterLink>
          </Button>
        </div>
      </header>

      <div
        v-if="!detalhe.cliente.tabelaPrecoId"
        class="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
      >
        <TriangleAlert class="mt-0.5 size-4 shrink-0" />
        Cliente sem tabela de preço. Não é possível montar pedido.
      </div>
      <div
        v-if="detalhe.cliente.creditoDisponivel === 0"
        class="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900"
      >
        <TriangleAlert class="mt-0.5 size-4 shrink-0" />
        Sem crédito disponível.
      </div>

      <dl class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="rounded-lg border p-3 sm:p-4">
          <dt class="text-muted-foreground text-sm">Limite</dt>
          <dd class="font-medium sm:text-lg">{{ formatarDinheiro(detalhe.cliente.limiteCredito) }}</dd>
        </div>
        <div class="rounded-lg border p-3 sm:p-4">
          <dt class="text-muted-foreground text-sm">Utilizado</dt>
          <dd class="font-medium sm:text-lg">{{ formatarDinheiro(detalhe.cliente.creditoUtilizado) }}</dd>
        </div>
        <div class="order-first col-span-2 rounded-lg border p-3 sm:order-none sm:col-span-1 sm:p-4">
          <dt class="text-muted-foreground text-sm">Disponível</dt>
          <dd
            class="text-lg font-semibold"
            :class="detalhe.cliente.creditoDisponivel === 0 ? 'text-destructive' : 'text-emerald-700'"
          >
            {{ formatarDinheiro(detalhe.cliente.creditoDisponivel) }}
          </dd>
          <dd v-if="detalhe.cliente.creditoEmAberto > 0" class="text-muted-foreground text-xs">
            {{ formatarDinheiro(detalhe.cliente.creditoEmAberto) }} em pedidos em aberto
          </dd>
        </div>
      </dl>

      <section class="flex flex-col gap-3">
        <h2 class="text-lg font-semibold">Histórico de pedidos</h2>
        <p v-if="detalhe.pedidos.length === 0" class="text-muted-foreground text-sm">
          Nenhum pedido anterior.
        </p>
        <ul v-else class="flex flex-col gap-2">
          <li v-for="pedido in detalhe.pedidos" :key="pedido.id">
            <Collapsible class="rounded-lg border">
              <CollapsibleTrigger
                class="group hover:bg-muted/50 flex w-full items-center justify-between gap-4 rounded-lg p-4 text-left"
              >
                <div class="flex flex-col">
                  <span class="font-medium">{{ formatarData(pedido.criadoEm) }}</span>
                  <span class="text-muted-foreground text-sm">
                    {{ rotulosStatus[pedido.status] }} · {{ pedido.quantidadeItens }}
                    {{ pedido.quantidadeItens === 1 ? 'item' : 'itens' }}
                  </span>
                </div>
                <div class="flex items-center gap-3">
                  <span class="font-medium">{{ formatarDinheiro(pedido.total) }}</span>
                  <ChevronDown
                    class="text-muted-foreground size-4 transition-transform group-data-[state=open]:rotate-180"
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent
                class="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden"
              >
                <ul class="divide-y border-t">
                  <li
                    v-for="item in pedido.itens"
                    :key="item.produtoId"
                    class="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                  >
                    <span class="font-medium">{{ item.descricao }}</span>
                    <div class="text-muted-foreground flex items-center justify-between gap-4 sm:justify-end">
                      <span>
                        {{ item.quantidade }} un × {{ formatarDinheiro(item.precoUnidade) }}
                        <span v-if="item.descontoPercentual > 0"> · -{{ item.descontoPercentual }}%</span>
                      </span>
                      <span class="text-foreground font-medium">{{ formatarDinheiro(item.subtotal) }}</span>
                    </div>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>
