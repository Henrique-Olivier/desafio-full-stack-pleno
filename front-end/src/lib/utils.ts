export { cn } from 'cn'

const formatoReal = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export const formatarDinheiro = (valor: number) => formatoReal.format(valor)

const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' })

export const formatarData = (iso: string) => formatoData.format(new Date(iso))
