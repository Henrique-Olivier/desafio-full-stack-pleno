<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowLeft, Search } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import CarrinhoPedido, { type LinhaPedido } from '@/components/CarrinhoPedido.vue'
import { api } from '@/service/api'
import { buscarProdutos, excedeAlcada, problemasDoPedido, subtotalCentavos } from '@/lib/pedido'
import { formatarDinheiro } from '@/lib/utils'
import { usePedidoEmMontagemStore } from '@/stores/pedidoEmMontagem'
import { useVendedorSelecionadoStore } from '@/stores/vendedorSelecionado'
import type { DetalheCliente } from '@/types/cliente'
import type { ProdutoDaTabela } from '@/types/produto'

const route = useRoute()
const clienteId = route.params.clienteId as string
const pedidoStore = usePedidoEmMontagemStore()
const vendedorStore = useVendedorSelecionadoStore()

const cliente = ref<DetalheCliente['cliente'] | null>(null)
const produtos = ref<ProdutoDaTabela[]>([])
const carregando = ref(true)
const erro = ref('')
const termo = ref('')

onMounted(async () => {
  try {
    const [detalhe, tabela] = await Promise.all([
      api.get<DetalheCliente>(`/carteira/${clienteId}`),
      api.get<ProdutoDaTabela[]>(`/carteira/${clienteId}/produtos`),
    ])
    cliente.value = detalhe.data.cliente
    produtos.value = tabela.data
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } }).response?.status
    erro.value =
      status === 404 ? 'Cliente não encontrado na sua carteira.' : 'Não foi possível carregar a tabela de preço.'
  } finally {
    carregando.value = false
  }
})

const produtosFiltrados = computed(() => buscarProdutos(produtos.value, termo.value))

const linhas = computed<LinhaPedido[]>(() =>
  pedidoStore.itensDoCliente(clienteId).flatMap((item) => {
    const produto = produtos.value.find((p) => p.id === item.produtoId)
    return produto ? [{ item, produto, subtotal: subtotalCentavos(produto.precoUnidade, item) / 100 }] : []
  }),
)

const total = computed(() => linhas.value.reduce((soma, l) => soma + Math.round(l.subtotal * 100), 0) / 100)

const problemas = computed(() =>
  cliente.value
    ? problemasDoPedido({
        total: total.value,
        creditoDisponivel: cliente.value.creditoDisponivel,
        temProdutoIndisponivel: linhas.value.some((l) => !l.produto.ativo),
      })
    : [],
)

const avisos = computed(() => {
  const alcada = vendedorStore.vendedor.alcadaDescontoPercentual
  return excedeAlcada(
    linhas.value.map((l) => l.item.descontoPercentual),
    alcada,
  )
    ? [`Desconto acima da sua alçada (${alcada}%). O pedido vai para aprovação do supervisor.`]
    : []
})
</script>

<template>
  <div class="flex flex-col gap-6 pb-24 xl:pb-0">
    <RouterLink
      :to="{ name: 'detalhe-cliente', params: { clienteId } }"
      class="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1 text-sm"
    >
      <ArrowLeft class="size-4" />
      Cliente
    </RouterLink>

    <p v-if="carregando" class="text-muted-foreground">Carregando tabela de preço...</p>
    <p v-else-if="erro" class="text-destructive">{{ erro }}</p>
    <p v-else-if="cliente && !cliente.tabelaPrecoId" class="text-destructive">
      Cliente sem tabela de preço. Não é possível montar pedido.
    </p>

    <template v-else-if="cliente">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold">Novo pedido</h1>
        <p class="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          {{ cliente.nomeFantasia }}
          <span class="rounded-md border px-2 py-0.5 text-xs">Tabela {{ cliente.tabelaPrecoId }}</span>
        </p>
      </header>

      <div class="grid gap-6 xl:grid-cols-[1fr_380px] xl:items-start">
        <section class="flex min-w-0 flex-col gap-3">
          <div class="relative">
            <Search class="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input v-model="termo" placeholder="Buscar por nome ou EAN" class="pl-9" aria-label="Buscar produto" />
          </div>

          <p v-if="produtosFiltrados.length === 0" class="text-muted-foreground text-sm">
            Nenhum produto encontrado.
          </p>
          <ul v-else class="flex flex-col gap-2">
            <li
              v-for="produto in produtosFiltrados"
              :key="produto.id"
              class="flex items-center justify-between gap-4 rounded-lg border p-3"
              :class="{ 'opacity-60': !produto.ativo }"
            >
              <div class="flex min-w-0 flex-col">
                <span class="font-medium">{{ produto.descricao }}</span>
                <span class="text-muted-foreground flex flex-wrap items-center gap-x-2 text-xs">
                  <span>{{ produto.ean }}</span>
                  <span v-if="produto.fatorEmbalagem > 1">
                    {{ produto.unidadeVenda }} c/ {{ produto.fatorEmbalagem }}
                    <template v-if="produto.vendaSomenteMultiplo"> · só múltiplos</template>
                  </span>
                  <span v-if="!produto.ativo" class="rounded-md border px-1.5 py-0.5 font-medium">Indisponível</span>
                </span>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                <span class="font-medium">{{ formatarDinheiro(produto.precoUnidade) }}</span>
                <Button
                  size="sm"
                  :variant="pedidoStore.itemDoProduto(clienteId, produto.id) ? 'secondary' : 'default'"
                  :disabled="!produto.ativo || !!pedidoStore.itemDoProduto(clienteId, produto.id)"
                  @click="pedidoStore.adicionar(clienteId, produto)"
                >
                  {{ pedidoStore.itemDoProduto(clienteId, produto.id) ? 'No pedido' : 'Adicionar' }}
                </Button>
              </div>
            </li>
          </ul>
        </section>

        <aside class="hidden rounded-lg border p-4 xl:sticky xl:top-4 xl:block">
          <h2 class="mb-2 text-lg font-semibold">Pedido</h2>
          <CarrinhoPedido :cliente-id="clienteId" :linhas="linhas" :total="total" :problemas="problemas" :avisos="avisos" />
        </aside>
      </div>

      <Sheet>
        <div class="bg-background fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 border-t p-4 xl:hidden">
          <div class="flex flex-col">
            <span class="text-muted-foreground text-sm">
              {{ linhas.length }} {{ linhas.length === 1 ? 'item' : 'itens' }}
            </span>
            <span class="font-semibold">{{ formatarDinheiro(total) }}</span>
          </div>
          <SheetTrigger as-child>
            <Button size="lg">Ver pedido</Button>
          </SheetTrigger>
        </div>
        <SheetContent side="bottom" class="max-h-[85dvh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Pedido</SheetTitle>
          </SheetHeader>
          <div class="px-4 pb-4">
            <CarrinhoPedido :cliente-id="clienteId" :linhas="linhas" :total="total" :problemas="problemas" :avisos="avisos" />
          </div>
        </SheetContent>
      </Sheet>
    </template>
  </div>
</template>
