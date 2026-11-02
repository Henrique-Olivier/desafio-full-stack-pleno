<script setup lang="ts">
import { ref } from 'vue'
import { Minus, Plus, Trash2, TriangleAlert } from '@lucide/vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { descreverEmbalagem, passoQuantidade, type ItemEmMontagem } from '@/lib/pedido'
import { formatarDinheiro } from '@/lib/utils'
import { usePedidoEmMontagemStore } from '@/stores/pedidoEmMontagem'
import type { ProdutoDaTabela } from '@/types/produto'

export type LinhaPedido = { item: ItemEmMontagem; produto: ProdutoDaTabela; subtotal: number }

const props = defineProps<{
  clienteId: string
  linhas: LinhaPedido[]
  total: number
  problemas: string[]
  avisos: string[]
  enviando?: boolean
}>()

const emit = defineEmits<{ enviar: [] }>()

const pedidoStore = usePedidoEmMontagemStore()
const tentouEnviar = ref(false)

function enviar() {
  tentouEnviar.value = true
  if (props.problemas.length === 0) emit('enviar')
}

function digitarQuantidade(item: ItemEmMontagem, produto: ProdutoDaTabela, evento: Event) {
  const campo = evento.target as HTMLInputElement
  pedidoStore.alterarQuantidade(props.clienteId, produto, Number(campo.value))
  campo.value = String(item.quantidade)
}

function digitarDesconto(item: ItemEmMontagem, evento: Event) {
  const campo = evento.target as HTMLInputElement
  pedidoStore.alterarDesconto(props.clienteId, item.produtoId, Number(campo.value))
  campo.value = String(item.descontoPercentual)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <p v-if="linhas.length === 0" class="text-muted-foreground text-sm">Nenhum item no pedido.</p>

    <ul v-else class="flex flex-col divide-y">
      <li v-for="{ item, produto, subtotal } in linhas" :key="item.produtoId" class="flex flex-col gap-2 py-3">
        <div class="flex items-start justify-between gap-2">
          <span class="text-sm font-medium">{{ produto.descricao }}</span>
          <Button
            variant="ghost"
            size="icon"
            class="size-7 shrink-0"
            :aria-label="`Remover ${produto.descricao}`"
            @click="pedidoStore.remover(clienteId, item.produtoId)"
          >
            <Trash2 class="size-4" />
          </Button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <div class="flex items-center">
            <Button
              variant="outline"
              size="icon"
              class="size-8"
              aria-label="Diminuir"
              @click="pedidoStore.alterarQuantidade(clienteId, produto, item.quantidade - passoQuantidade(produto))"
            >
              <Minus class="size-4" />
            </Button>
            <Input
              :model-value="item.quantidade"
              type="number"
              inputmode="numeric"
              :step="passoQuantidade(produto)"
              :min="passoQuantidade(produto)"
              class="mx-1 h-8 w-16 text-center"
              aria-label="Quantidade em unidades"
              @change="digitarQuantidade(item, produto, $event)"
            />
            <Button
              variant="outline"
              size="icon"
              class="size-8"
              aria-label="Aumentar"
              @click="pedidoStore.alterarQuantidade(clienteId, produto, item.quantidade + passoQuantidade(produto))"
            >
              <Plus class="size-4" />
            </Button>
          </div>
          <span class="text-muted-foreground text-xs">
            un<template v-if="descreverEmbalagem(produto, item.quantidade)">
              ({{ descreverEmbalagem(produto, item.quantidade) }})</template
            >
          </span>

          <label class="ml-auto flex items-center gap-1 text-sm">
            <span class="text-muted-foreground">Desc.</span>
            <Input
              :model-value="item.descontoPercentual"
              type="number"
              inputmode="decimal"
              min="0"
              max="100"
              step="0.5"
              class="h-8 w-16 text-right"
              aria-label="Desconto em porcentagem"
              @change="digitarDesconto(item, $event)"
            />
            <span class="text-muted-foreground">%</span>
          </label>
        </div>

        <div class="text-muted-foreground flex justify-between text-sm">
          <span>{{ formatarDinheiro(produto.precoUnidade) }} / un</span>
          <span class="text-foreground font-medium">{{ formatarDinheiro(subtotal) }}</span>
        </div>
      </li>
    </ul>

    <div class="flex items-center justify-between border-t pt-3">
      <span class="font-medium">Total</span>
      <span class="text-lg font-semibold">{{ formatarDinheiro(total) }}</span>
    </div>

    <div
      v-for="aviso in avisos"
      :key="aviso"
      class="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
    >
      <TriangleAlert class="mt-0.5 size-4 shrink-0" />
      {{ aviso }}
    </div>

    <div class="flex flex-col gap-2">
      <template v-if="tentouEnviar">
        <p v-for="problema in problemas" :key="problema" class="text-destructive text-sm">{{ problema }}</p>
      </template>
      <Button size="lg" :disabled="linhas.length === 0 || enviando" @click="enviar">
        {{ enviando ? 'Enviando...' : 'Enviar pedido' }}
      </Button>
    </div>
  </div>
</template>
