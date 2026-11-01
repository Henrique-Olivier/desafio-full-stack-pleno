export { cn } from 'cn'

const formatoReal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatarDinheiro = (valor: number) => formatoReal.format(valor)
