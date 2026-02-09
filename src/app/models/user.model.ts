export interface User {
  id?: number | string;
  nome: string;
  email: string;

  telefone?: string | null;
  avatarUrl?: string | null; // pode ser URL normal ou DataURL (base64)
}
