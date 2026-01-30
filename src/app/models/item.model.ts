export type ItemTipo = 'EMPRESA' | 'PROFISSIONAL' | 'SERVICO';

export interface Item {
  id: number;
  tipo: ItemTipo;
  nome: string;
  atividade: string; // ✅ novo campo
  ativo: boolean;
}
