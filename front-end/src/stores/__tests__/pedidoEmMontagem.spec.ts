import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { usePedidoEmMontagemStore } from '@/stores/pedidoEmMontagem'
import type { ProdutoDaTabela } from '@/types/produto'

const umProduto = (sobrescrever: Partial<ProdutoDaTabela> = {}): ProdutoDaTabela => ({
  id: 'P1',
  sku: 'SKU-1',
  ean: '7890000000001',
  descricao: 'Arroz Branco 5kg',
  categoria: 'mercearia',
  marca: 'Marca',
  unidadeVenda: 'UN',
  fatorEmbalagem: 1,
  vendaSomenteMultiplo: false,
  ativo: true,
  precoUnidade: 10,
  ...sobrescrever,
})

const fardoDe10 = umProduto({ id: 'P2', unidadeVenda: 'FD', fatorEmbalagem: 10, vendaSomenteMultiplo: true })

describe('pedido em montagem', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('adiciona o produto com uma unidade e sem desconto', () => {
    const store = usePedidoEmMontagemStore()

    store.adicionar('C001', umProduto())

    expect(store.itensDoCliente('C001')).toEqual([{ produtoId: 'P1', quantidade: 1, descontoPercentual: 0 }])
  })

  it('produto vendido só em múltiplo entra com uma embalagem', () => {
    const store = usePedidoEmMontagemStore()

    store.adicionar('C001', fardoDe10)

    expect(store.itemDoProduto('C001', 'P2')?.quantidade).toBe(10)
  })

  it('não adiciona produto inativo', () => {
    const store = usePedidoEmMontagemStore()

    store.adicionar('C001', umProduto({ ativo: false }))

    expect(store.itensDoCliente('C001')).toEqual([])
  })

  it('não adiciona o mesmo produto duas vezes', () => {
    const store = usePedidoEmMontagemStore()

    store.adicionar('C001', umProduto())
    store.adicionar('C001', umProduto())

    expect(store.itensDoCliente('C001')).toHaveLength(1)
  })

  it('ajusta a quantidade ao múltiplo da embalagem', () => {
    const store = usePedidoEmMontagemStore()
    store.adicionar('C001', fardoDe10)

    store.alterarQuantidade('C001', fardoDe10, 17)

    expect(store.itemDoProduto('C001', 'P2')?.quantidade).toBe(20)
  })

  it('limita o desconto a 100%', () => {
    const store = usePedidoEmMontagemStore()
    store.adicionar('C001', umProduto())

    store.alterarDesconto('C001', 'P1', 150)

    expect(store.itemDoProduto('C001', 'P1')?.descontoPercentual).toBe(100)
  })

  it('remove o item do pedido', () => {
    const store = usePedidoEmMontagemStore()
    store.adicionar('C001', umProduto())

    store.remover('C001', 'P1')

    expect(store.itensDoCliente('C001')).toEqual([])
  })

  it('cada cliente tem o seu pedido em montagem', () => {
    const store = usePedidoEmMontagemStore()

    store.adicionar('C001', umProduto())

    expect(store.itensDoCliente('C002')).toEqual([])
  })

  it('o pedido continua salvo depois de recarregar a página', async () => {
    usePedidoEmMontagemStore().adicionar('C001', umProduto())
    await nextTick()

    setActivePinia(createPinia())

    expect(usePedidoEmMontagemStore().itensDoCliente('C001')).toHaveLength(1)
  })

  it('valor inválido salvo no navegador não quebra a tela', () => {
    localStorage.setItem('pedidosEmMontagem', 'não é json')
    setActivePinia(createPinia())

    expect(usePedidoEmMontagemStore().itensDoCliente('C001')).toEqual([])
  })
})
