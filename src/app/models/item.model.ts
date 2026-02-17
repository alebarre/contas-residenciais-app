export type ItemTipo = 'EMPRESA' | 'PROFISSIONAL' | 'SERVICO' | 'DESPESA';

export interface Item {
  id: number;
  tipo: ItemTipo;
  nome: string;
  atividade: string; // ✅ novo campo
  ativo: boolean;
}
