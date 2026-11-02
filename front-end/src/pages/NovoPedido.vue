<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter, type RouteLocationNormalized } from 'vue-router'
import { ArrowLeft, CircleCheck, Clock, Info, Search } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import CarrinhoPedido, { type LinhaPedido } from '@/components/CarrinhoPedido.vue'
import { api } from '@/service/api'
import {
  buscarProdutos,
  excedeAlcada,
  itensParaRepetir,
  mensagemDoProblema,
  problemasDoPedido,
  subtotalCentavos,
  type ProblemaDoServidor,
} from '@/lib/pedido'
import { formatarData, formatarDinheiro } from '@/lib/utils'
import { usePedidoEmMontagemStore, type Rascunho } from '@/stores/pedidoEmMontagem'
import { useVendedorSelecionadoStore } from '@/stores/vendedorSelecionado'
import type { DetalheCliente, ResumoPedido } from '@/types/cliente'
import type { ProdutoDaTabela } from '@/types/produto'

const route = useRoute()
const router = useRouter()
const clienteId = route.params.clienteId as string
const pedidoStore = usePedidoEmMontagemStore()
const vendedorStore = useVendedorSelecionadoStore()

const cliente = ref<DetalheCliente['cliente'] | null>(null)
const produtos = ref<ProdutoDaTabela[]>([])
const carregando = ref(true)
const erro = ref('')
const termo = ref('')
const enviando = ref(false)
const problemasDoServidor = ref<string[]>([])
const avisosDaRepeticao = ref<string[]>([])
const repeticaoPendente = ref(false)
const confirmandoSaida = ref(false)
let destinoAoSair: RouteLocationNormalized | undefined
let rascunhoAntesDaRepeticao: Rascunho | undefined
const pedidoEnviado = ref<{ status: ResumoPedido['status']; total: number } | null>(null)

onMounted(async () => {
  try {
    const [detalhe, tabela] = await Promise.all([
      api.get<DetalheCliente>(`/carteira/${clienteId}`),
      api.get<ProdutoDaTabela[]>(`/carteira/${clienteId}/produtos`),
    ])
    cliente.value = detalhe.data.cliente
    produtos.value = tabela.data
    const pedidoRepetido = detalhe.data.pedidos.find((p) => p.id === route.query.repetir)
    if (pedidoRepetido && cliente.value.tabelaPrecoId) repetir(pedidoRepetido)
    if (route.query.repetir) router.replace({ query: {} })
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } }).response?.status
    erro.value =
      status === 404 ? 'Cliente não encontrado na sua carteira.' : 'Não foi possível carregar a tabela de preço.'
  } finally {
    carregando.value = false
  }
})

function repetir(pedido: ResumoPedido) {
  const { itens, deFora } = itensParaRepetir(pedido.itens, produtos.value)
  const substituiu = pedidoStore.itensDoCliente(clienteId).length > 0
  rascunhoAntesDaRepeticao = pedidoStore.copiaDoRascunho(clienteId)
  pedidoStore.substituir(clienteId, itens)
  repeticaoPendente.value = true
  avisosDaRepeticao.value = [
    `Pedido de ${formatarData(pedido.criadoEm)} repetido com os preços atuais e sem desconto.`,
    ...(substituiu ? ['O pedido que estava em montagem foi substituído.'] : []),
    ...(deFora.length > 0
      ? [`${deFora.length === 1 ? '1 item ficou' : `${deFora.length} itens ficaram`} de fora: ${deFora.join(', ')}.`]
      : []),
  ]
}

onBeforeRouteLeave((destino) => {
  if (!repeticaoPendente.value) return
  destinoAoSair = destino
  confirmandoSaida.value = true
  return false
})

function sairDoPedidoRepetido(manterRascunho: boolean) {
  if (!manterRascunho) pedidoStore.restaurar(clienteId, rascunhoAntesDaRepeticao)
  repeticaoPendente.value = false
  confirmandoSaida.value = false
  if (destinoAoSair) router.push(destinoAoSair)
}

const produtosFiltrados = computed(() => buscarProdutos(produtos.value, termo.value))

const linhas = computed<LinhaPedido[]>(() =>
  pedidoStore.itensDoCliente(clienteId).flatMap((item) => {
    const produto = produtos.value.find((p) => p.id === item.produtoId)
    return produto ? [{ item, produto, subtotal: subtotalCentavos(produto.precoUnidade, item) / 100 }] : []
  }),
)

const total = computed(() => linhas.value.reduce((soma, l) => soma + Math.round(l.subtotal * 100), 0) / 100)

const problemas = computed(() => [
  ...(cliente.value
    ? problemasDoPedido({
        total: total.value,
        creditoDisponivel: cliente.value.creditoDisponivel,
        temProdutoIndisponivel: linhas.value.some((l) => !l.produto.ativo),
      })
    : []),
  ...problemasDoServidor.value,
])

watch(linhas, () => (problemasDoServidor.value = []), { deep: true })

async function enviarPedido() {
  enviando.value = true
  try {
    const { data } = await api.post<{ status: ResumoPedido['status']; total: number }>('/pedidos', {
      id: pedidoStore.idDoPedido(clienteId),
      clienteId,
      itens: pedidoStore.itensDoCliente(clienteId),
    })
    repeticaoPendente.value = false
    pedidoStore.limpar(clienteId)
    pedidoEnviado.value = data
  } catch (e: unknown) {
    const resposta = (e as { response?: { status?: number; data?: { problemas?: ProblemaDoServidor[] } } }).response
    const descricaoDoProduto = (id: string) => produtos.value.find((p) => p.id === id)?.descricao
    problemasDoServidor.value =
      resposta?.status === 422 && resposta.data?.problemas
        ? resposta.data.problemas.map((p) => mensagemDoProblema(p, descricaoDoProduto))
        : ['Não foi possível enviar o pedido. Verifique a conexão e tente de novo.']
  } finally {
    enviando.value = false
  }
}

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

    <section v-else-if="pedidoEnviado" class="flex flex-col items-start gap-3 rounded-lg border p-6">
      <template v-if="pedidoEnviado.status === 'AguardandoAprovacao'">
        <Clock class="size-8 text-amber-600" />
        <h1 class="text-xl font-semibold">Pedido aguardando aprovação</h1>
        <p class="text-muted-foreground text-sm">O desconto passou da sua alçada. O supervisor precisa aprovar.</p>
      </template>
      <template v-else>
        <CircleCheck class="size-8 text-emerald-600" />
        <h1 class="text-xl font-semibold">Pedido enviado</h1>
      </template>
      <p class="font-medium">Total {{ formatarDinheiro(pedidoEnviado.total) }}</p>
      <Button as-child>
        <RouterLink :to="{ name: 'detalhe-cliente', params: { clienteId } }">Voltar ao cliente</RouterLink>
      </Button>
    </section>

    <template v-else-if="cliente">
      <header class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold">Novo pedido</h1>
        <p class="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          {{ cliente.nomeFantasia }}
          <span class="rounded-md border px-2 py-0.5 text-xs">Tabela {{ cliente.tabelaPrecoId }}</span>
        </p>
      </header>

      <div
        v-if="avisosDaRepeticao.length > 0"
        class="flex items-start gap-2 rounded-lg border border-sky-300 bg-sky-50 p-3 text-sm text-sky-900"
      >
        <Info class="mt-0.5 size-4 shrink-0" />
        <div class="flex flex-col gap-1">
          <p v-for="aviso in avisosDaRepeticao" :key="aviso">{{ aviso }}</p>
        </div>
      </div>

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
          <CarrinhoPedido :cliente-id="clienteId" :linhas="linhas" :total="total" :problemas="problemas" :avisos="avisos" :enviando="enviando" @enviar="enviarPedido" />
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
            <CarrinhoPedido :cliente-id="clienteId" :linhas="linhas" :total="total" :problemas="problemas" :avisos="avisos" :enviando="enviando" @enviar="enviarPedido" />
          </div>
        </SheetContent>
      </Sheet>
    </template>

    <AlertDialog v-model:open="confirmandoSaida">
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Sair do pedido repetido?</AlertDialogTitle>
          <AlertDialogDescription>
            Você pode salvar este pedido como rascunho para continuar depois ou descartá-lo. Se descartar, volta o
            pedido que estava em montagem antes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Continuar no pedido</AlertDialogCancel>
          <Button variant="outline" @click="sairDoPedidoRepetido(false)">Descartar</Button>
          <AlertDialogAction @click="sairDoPedidoRepetido(true)">Salvar rascunho</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
</template>
