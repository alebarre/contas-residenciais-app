export interface Despesa {
  id: string;                      // UUID
  dataPagamento?: string | null;    // opcional
  dataVencimento: string;           // ISO yyyy-MM-dd
  itemId: string;                   // UUID
  itemNome: string;
  descricao: string;

  bancoPagamento: string;           // resolvido pelo backend (string pronta p/ UI)
  bancoCode?: number | null;        // opcional (sem banco permitido)

  valor: number;
}
