import { describe, expect, it } from 'vitest'
import {
  ajustarDesconto,
  ajustarQuantidade,
  buscarProdutos,
  descreverEmbalagem,
  excedeAlcada,
  passoQuantidade,
  problemasDoPedido,
  subtotalCentavos,
} from '@/lib/pedido'
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

const fardoDe10 = umProduto({ unidadeVenda: 'FD', fatorEmbalagem: 10, vendaSomenteMultiplo: true })

describe('quantidade', () => {
  it('anda de uma em uma unidade quando o produto não exige múltiplo', () => {
    expect(passoQuantidade(umProduto({ fatorEmbalagem: 12 }))).toBe(1)
  })

  it('anda de embalagem em embalagem quando o produto só vende em múltiplo', () => {
    expect(passoQuantidade(fardoDe10)).toBe(10)
  })

  it('arredonda para o múltiplo mais próximo', () => {
    expect(ajustarQuantidade(fardoDe10, 13)).toBe(10)
    expect(ajustarQuantidade(fardoDe10, 16)).toBe(20)
  })

  it('nunca fica abaixo de uma embalagem', () => {
    expect(ajustarQuantidade(fardoDe10, 0)).toBe(10)
    expect(ajustarQuantidade(fardoDe10, -20)).toBe(10)
  })

  it('aceita qualquer quantidade inteira quando o produto não exige múltiplo', () => {
    expect(ajustarQuantidade(umProduto(), 7)).toBe(7)
  })
})

describe('desconto', () => {
  it('limita o desconto entre 0 e 100%', () => {
    expect(ajustarDesconto(150)).toBe(100)
    expect(ajustarDesconto(-5)).toBe(0)
  })

  it('desconto inválido vira zero', () => {
    expect(ajustarDesconto(Number.NaN)).toBe(0)
  })

  it('mantém desconto com casas decimais', () => {
    expect(ajustarDesconto(2.5)).toBe(2.5)
  })
})

describe('subtotal', () => {
  it('aplica o desconto e devolve centavos', () => {
    expect(subtotalCentavos(8.49, { produtoId: 'P1', quantidade: 12, descontoPercentual: 5 })).toBe(9_679)
  })
})

describe('embalagem', () => {
  it('descreve a quantidade em embalagens fechadas', () => {
    expect(descreverEmbalagem(fardoDe10, 20)).toBe('2 FD')
  })

  it('não descreve quando a quantidade não fecha embalagem', () => {
    expect(descreverEmbalagem(umProduto({ unidadeVenda: 'CX', fatorEmbalagem: 12 }), 5)).toBe('')
  })

  it('não descreve produto vendido por unidade', () => {
    expect(descreverEmbalagem(umProduto(), 3)).toBe('')
  })
})

describe('busca de produtos', () => {
  const produtos = [
    umProduto({ id: 'P1', descricao: 'Açúcar Cristal 1kg', ean: '7891000000001' }),
    umProduto({ id: 'P2', descricao: 'Achocolatado em Pó', ean: '7891000000002' }),
    umProduto({ id: 'P3', descricao: 'Achocolatado Sachê', ean: '7891000000002' }),
  ]

  it('busca vazia traz todos os produtos', () => {
    expect(buscarProdutos(produtos, '  ')).toHaveLength(3)
  })

  it('busca por nome ignora acento e maiúsculas', () => {
    expect(buscarProdutos(produtos, 'ACUCAR').map((p) => p.id)).toEqual(['P1'])
  })

  it('busca por EAN exige o código completo', () => {
    expect(buscarProdutos(produtos, '7891000000001').map((p) => p.id)).toEqual(['P1'])
    expect(buscarProdutos(produtos, '78910')).toEqual([])
  })

  it('EAN duplicado traz todos os produtos com o código', () => {
    expect(buscarProdutos(produtos, '7891000000002').map((p) => p.id)).toEqual(['P2', 'P3'])
  })
})

describe('problemas do pedido', () => {
  const pedidoValido = { total: 500, creditoDisponivel: 1_000, temProdutoIndisponivel: false }

  it('pedido válido não tem problemas', () => {
    expect(problemasDoPedido(pedidoValido)).toEqual([])
  })

  it('avisa quanto falta para o pedido mínimo', () => {
    const problemas = problemasDoPedido({ ...pedidoValido, total: 47.9 })

    expect(problemas).toHaveLength(1)
    expect(problemas[0]).toMatch(/Faltam R\$\s252,10/)
  })

  it('pedido de exatamente R$ 300,00 não tem problemas', () => {
    expect(problemasDoPedido({ ...pedidoValido, total: 300 })).toEqual([])
  })

  it('bloqueia total acima do crédito disponível', () => {
    const problemas = problemasDoPedido({ ...pedidoValido, creditoDisponivel: 350, total: 676 })

    expect(problemas).toHaveLength(1)
    expect(problemas[0]).toMatch(/crédito disponível \(R\$\s350,00\)/)
  })

  it('total igual ao crédito disponível não tem problemas', () => {
    expect(problemasDoPedido({ ...pedidoValido, creditoDisponivel: 500 })).toEqual([])
  })

  it('pede para remover produtos indisponíveis', () => {
    expect(problemasDoPedido({ ...pedidoValido, temProdutoIndisponivel: true })).toEqual([
      'Remova os produtos indisponíveis.',
    ])
  })
})

describe('alçada', () => {
  it('desconto acima da alçada vai para aprovação', () => {
    expect(excedeAlcada([0, 6], 5)).toBe(true)
  })

  it('desconto igual à alçada não vai para aprovação', () => {
    expect(excedeAlcada([5, 5], 5)).toBe(false)
  })
})
