export interface Despesa {
  id: number;
  dataPagamento?: string | null;  // opcional
  dataVencimento: string;         // ISO yyyy-MM-dd
  itemId: number;
  itemNome: string;
  descricao: string;
  bancoPagamento: string;
  bancoCode?: number | null; // opcional (não obrigatório)
  valor: number;
}
