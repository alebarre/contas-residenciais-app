export interface Banco {
  code: number;        // "code" da BrasilAPI (ex.: 1, 237, 260)
  name: string;        // nome curto
  fullName?: string;   // pode vir como fullName
  ispb?: string;       // pode vir como string
}
