export type Cliente = {
    id: string;
    nomeFantasia: string;
    razaoSocial: string;
    cnpj: string;
    tabelaPrecoId: string | null
    limiteCredito: number;
    creditoUtilizado: number;
    cidade: string | null;
    uf: string | null;
} 
export const creditoDisponivelCentavos = (limiteCentavos: number, utilizadoCentavos: number) =>
  Math.max(0, limiteCentavos - utilizadoCentavos)
