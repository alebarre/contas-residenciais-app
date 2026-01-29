import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Despesa } from '../models/despesa.model';

@Injectable({ providedIn: 'root' })
export class DespesasService {
  listarPorMes(ano: number, mes: number): Observable<Despesa[]> {
    // mock simples (depois vira GET /api/despesas?ano=...&mes=...)
    const base: Despesa[] = [
      {
        id: 1,
        dataPagamento: `${ano}-${String(mes).padStart(2, '0')}-05`,
        dataVencimento: `${ano}-${String(mes).padStart(2, '0')}-10`,
        itemId: 1,
        itemNome: 'Light (Luz)',
        descricao: 'Conta de energia',
        bancoPagamento: 'Nubank',
        valor: 312.45
      },
      {
        id: 2,
        dataPagamento: `${ano}-${String(mes).padStart(2, '0')}-08`,
        dataVencimento: `${ano}-${String(mes).padStart(2, '0')}-12`,
        itemId: 2,
        itemNome: 'CEDAE (Água)',
        descricao: 'Conta de água',
        bancoPagamento: 'Banco do Brasil',
        valor: 178.10
      },
      {
        id: 3,
        dataPagamento: `${ano}-${String(mes).padStart(2, '0')}-15`,
        dataVencimento: `${ano}-${String(mes).padStart(2, '0')}-15`,
        itemId: 5,
        itemNome: 'Fisioterapeuta',
        descricao: 'Sessões do mês',
        bancoPagamento: 'Itaú',
        valor: 480.00
      }
    ];

    return of(base);
  }
}
