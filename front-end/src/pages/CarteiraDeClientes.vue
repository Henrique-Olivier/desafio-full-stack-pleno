<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/service/api';
import type { Cliente } from '@/types/cliente';
import { formatarDinheiro } from '@/lib/utils'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

const router = useRouter()
const clientes = ref<Cliente[]>([])
const carregando = ref(true)
const erro = ref(false)


onMounted(async () => {
    try {
        const { data } = await api.get<Cliente[]>('/carteira')
        clientes.value = data
    } catch (error) {
        console.error('Erro ao carregar clientes:', error)
        erro.value = true
    } finally {
        carregando.value = false
    }
})

</script>

<template>
    <div class="flex flex-col gap-6">
        <h1 class="text-2xl font-semibold">Carteira de clientes</h1>
        <p v-if="carregando" class="text-muted-foreground">Carregando clientes...</p>
        <p v-else-if="erro" class="text-destructive">Não foi possível carregar os clientes.</p>
        <p v-else-if="clientes.length === 0 && !erro" class="text-muted-foreground">Nenhum cliente encontrado.</p>
        <template v-else>
        <ul class="grid gap-3 sm:grid-cols-2 xl:hidden">
            <li v-for="cliente in clientes" :key="cliente.id">
                <RouterLink
                    :to="{ name: 'detalhe-cliente', params: { clienteId: cliente.id } }"
                    class="hover:bg-muted/50 block rounded-lg border p-4"
                >
                <div class="flex items-start justify-between gap-2">
                    <p class="font-medium">{{ cliente.nomeFantasia }}</p>
                    <span class="text-muted-foreground text-xs">{{ cliente.id }}</span>
                </div>
                <p class="text-muted-foreground text-sm">{{ cliente.razaoSocial }}</p>
                <dl class="mt-3 grid grid-cols-2 gap-1 text-sm">
                    <dt class="text-muted-foreground">Limite</dt>
                    <dd class="text-right">{{ formatarDinheiro(cliente.limiteCredito) }}</dd>
                    <dt class="text-muted-foreground">Utilizado</dt>
                    <dd class="text-right">{{ formatarDinheiro(cliente.creditoUtilizado) }}</dd>
                </dl>
                </RouterLink>
            </li>
        </ul>
        <Table class="hidden w-full xl:table">
            <TableHeader>
                <TableRow>
                    <TableHead class="w-[100px]">
                        ID
                    </TableHead>
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>Razão Social</TableHead>
                    <TableHead class="text-right">
                        Limite de Crédito
                    </TableHead>
                    <TableHead class="text-right">
                        Crédito Utilizado
                    </TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                <TableRow
                    v-for="cliente in clientes"
                    :key="cliente.id"
                    class="cursor-pointer"
                    @click="router.push({ name: 'detalhe-cliente', params: { clienteId: cliente.id } })"
                >
                    <TableCell class="font-medium">
                        {{ cliente.id }}
                    </TableCell>
                    <TableCell>
                        <RouterLink :to="{ name: 'detalhe-cliente', params: { clienteId: cliente.id } }" @click.stop>
                            {{ cliente.nomeFantasia }}
                        </RouterLink>
                    </TableCell>
                    <TableCell>{{ cliente.razaoSocial }}</TableCell>
                    <TableCell class="text-right">
                        {{ formatarDinheiro(cliente.limiteCredito) }}
                    </TableCell>
                    <TableCell class="text-right">
                        {{ formatarDinheiro(cliente.creditoUtilizado) }}
                    </TableCell>
                </TableRow>
            </TableBody>
        </Table>
        </template>

    </div>
</template>
