export interface DashboardResumo {
  contasDoMes: number;
  maiorDespesaDoMes?: { itemNome: string; valor: number };
  totalPagoNoMes: number;
  historicoMensal: Array<{ mes: number; total: number }>; // 1..12
}
