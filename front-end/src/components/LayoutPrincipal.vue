<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { LogOut, Menu, PanelLeft, Users } from '@lucide/vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useVendedorSelecionadoStore } from '@/stores/vendedorSelecionado'

const telas = [{ rota: 'carteira', titulo: 'Carteira', icone: Users }]

const route = useRoute()
const router = useRouter()
const vendedorStore = useVendedorSelecionadoStore()

const iniciais = computed(() => {
  const partes = vendedorStore.vendedor.nome.trim().split(/\s+/)
  return ((partes[0]?.[0] ?? '') + (partes.length > 1 ? (partes.at(-1)?.[0] ?? '') : '')).toUpperCase()
})

function sair() {
  vendedorStore.limparVendedor()
  router.push({ name: 'login' })
}
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem v-for="tela in telas" :key="tela.rota">
              <SidebarMenuButton as-child :is-active="route.name === tela.rota" :tooltip="tela.titulo">
                <RouterLink :to="{ name: tela.rota }">
                  <component :is="tela.icone" />
                  <span>{{ tela.titulo }}</span>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as="div" :tooltip="vendedorStore.vendedor.nome">
              <Avatar class="size-8">
                <AvatarFallback>{{ iniciais }}</AvatarFallback>
              </Avatar>
              <span class="truncate font-medium">{{ vendedorStore.vendedor.nome }}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sair" @click="sair">
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>

    <SidebarInset>
      <header class="flex h-14 items-center justify-between border-b px-4">
        <SidebarTrigger>
          <Menu class="md:hidden" />
          <PanelLeft class="hidden md:block" />
        </SidebarTrigger>

        <DropdownMenu>
          <DropdownMenuTrigger class="rounded-full md:hidden">
            <Avatar class="size-8">
              <AvatarFallback>{{ iniciais }}</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{{ vendedorStore.vendedor.nome }}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem @select="sair">
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      <main class="p-4 md:p-8">
        <RouterView />
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>
