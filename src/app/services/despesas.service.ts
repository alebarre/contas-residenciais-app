import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Despesa, PaymentMethod } from '../models/despesa.model';

@Injectable({ providedIn: 'root' })
export class DespesasService {
  private http = inject(HttpClient);

  listarPorMes(ano: number, mes: number): Observable<Despesa[]> {
    const mm = String(mes).padStart(2, '0');
    const month = `${ano}-${mm}`;
    const params = new HttpParams().set('month', month);
    return this.http.get<Despesa[]>('/api/expenses', { params });
  }

  listarPorAno(ano: number): Observable<Despesa[]> {
    const params = new HttpParams().set('year', String(ano));
    return this.http.get<Despesa[]>('/api/expenses', { params });
  }

  criar(payload: {
    itemId: string;
    dataVencimento: string;
    dataPagamento?: string | null;
    descricao: string;
    bancoCode?: number | null;
    paymentMethod: PaymentMethod;
    valor: number;
  }): Observable<Despesa> {
    const body = {
      itemId: payload.itemId,
      dataVencimento: payload.dataVencimento,
      dataPagamento: payload.dataPagamento ?? null,
      descricao: payload.descricao ?? '',
      bancoCode: payload.bancoCode ?? null,
      paymentMethod: payload.paymentMethod, // ✅ NOVO
      valor: Number(payload.valor)
    };

    return this.http.post<Despesa>('/api/expenses', body);
  }

  // ✅ Edição inline do dashboard: NÃO altera paymentMethod (Solução 1)
  atualizar(despesa: Despesa): Observable<Despesa> {
    const body: any = {
      itemId: despesa.itemId,
      dataVencimento: despesa.dataVencimento,
      dataPagamento: despesa.dataPagamento ?? null,
      bancoCode: despesa.bancoCode ?? null,
      valor: Number(despesa.valor),
      descricao: despesa.descricao ?? ''
    };

    return this.http.patch<Despesa>(`/api/expenses/${despesa.id}`, body);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`/api/expenses/${id}`);
  }
}
