export interface Despesa {
  id: number;
  dataPagamento: string;   // ISO: yyyy-MM-dd
  dataVencimento: string;  // ISO: yyyy-MM-dd
  itemId: number;
  itemNome: string;        // redundante p/ tabela (no backend pode vir via join/DTO)
  descricao: string;
  bancoPagamento: string;
  valor: number;
}
