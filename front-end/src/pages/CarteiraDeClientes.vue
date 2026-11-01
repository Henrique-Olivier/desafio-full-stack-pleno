<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useVendedorSelecionadoStore } from '@/stores/vendedorSelecionado'
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

const vendedorStore = useVendedorSelecionadoStore()
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
    <main class="mx-auto flex min-h-screen w-screen flex-col gap-6 p-24">
        <h1 class="text-2xl font-semibold">Vendedor Selecionado: {{ vendedorStore.vendedor.nome }}</h1>
        <p v-if="carregando" class="text-muted-foreground">Carregando clientes...</p>
        <p v-else-if="erro" class="text-destructive">Não foi possível carregar os clientes.</p>
        <p v-else-if="clientes.length === 0 && !erro" class="text-muted-foreground">Nenhum cliente encontrado.</p>
        <Table v-else class="w-full">
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
                <TableRow v-for="cliente in clientes" :key="cliente.id">
                    <TableCell class="font-medium">
                        {{ cliente.id }}
                    </TableCell>
                    <TableCell>{{ cliente.nomeFantasia }}</TableCell>
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

    </main>
</template>
