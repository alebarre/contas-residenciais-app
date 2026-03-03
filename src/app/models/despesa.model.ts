export type PaymentMethod = 'PIX'|'DINHEIRO'|'CREDITO'|'TRANSFERENCIA'|'OUTROS';

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  PIX: 'Pix',
  DINHEIRO: 'Dinheiro',
  CREDITO: 'Crédito',
  TRANSFERENCIA: 'Transferência bancária',
  OUTROS: 'Outros'
};

export interface Despesa {
  id: string;
  dataPagamento?: string | null;
  dataVencimento: string;

  itemId: string;
  itemNome: string;

  descricao: string;

  bancoPagamento: string;
  bancoCode?: number | null;

  valor: number;

  paymentMethod: PaymentMethod; // ✅ NOVO
}
