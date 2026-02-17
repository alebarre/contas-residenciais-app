import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Despesa } from '../models/despesa.model';

type YearMonth = string; // 'YYYY-MM'

@Injectable({ providedIn: 'root' })
export class DespesasService {
  constructor(private http: HttpClient) {}

  // -----------------------------
  // Helpers
  // -----------------------------
  private toYearMonth(ano: number, mes: number): YearMonth {
    const mm = String(mes).padStart(2, '0');
    return `${ano}-${mm}`;
  }

  // -----------------------------
  // API (backend)
  // -----------------------------

  /** Lista despesas do mês (usado no Dashboard) */
  listarPorMes(ano: number, mes: number): Observable<Despesa[]> {
    const ym = this.toYearMonth(ano, mes);
    const params = new HttpParams().set('month', ym);
    return this.http.get<Despesa[]>('/api/expenses', { params }).pipe(
      map((list) => list ?? [])
    );
  }

  /** Alternativa direta caso alguma tela já use yyyyMm */
  listarMes(yyyyMm: string): Observable<Despesa[]> {
    const params = new HttpParams().set('month', yyyyMm);
    return this.http.get<Despesa[]>('/api/expenses', { params }).pipe(
      map((list) => list ?? [])
    );
  }

  /** Criação (tela /app/despesas/nova) */
  criar(payload: Omit<Despesa, 'id'>): Observable<Despesa> {
    this.validar(payload as Despesa);
    return this.http.post<Despesa>('/api/expenses', payload);
  }

  /** Atualização (Dashboard edit inline) */
  atualizar(despesa: Despesa): Observable<Despesa> {
    if (!despesa?.id) throw new Error('Id é obrigatório para atualizar');
    this.validar(despesa);

    // payload “de atualização” (mantém compatível com backend; inclui bancoCode opcional)
    const body = {
      dataVencimento: despesa.dataVencimento,
      dataPagamento: despesa.dataPagamento ?? null,
      bancoCode: despesa.bancoCode ?? null,
      valor: despesa.valor,
      descricao: despesa.descricao ?? ''
    };

    return this.http.patch<Despesa>(`/api/expenses/${despesa.id}`, body);
  }

  /** Exclusão efetiva (o undo é no front) */
  excluir(id: string): Observable<void> {
    if (!id) throw new Error('Id é obrigatório para excluir');
    return this.http.delete<void>(`/api/expenses/${id}`);
  }

  // -----------------------------
  // Regras utilitárias (client-side)
  // -----------------------------
  private validar(d: Despesa): void {
    if (!d.descricao?.trim()) throw new Error('Descrição é obrigatória');
    if (d.valor == null || Number(d.valor) <= 0) throw new Error('Valor deve ser maior que zero');
    if (!d.dataVencimento) throw new Error('Data de vencimento é obrigatória');
  }
}
