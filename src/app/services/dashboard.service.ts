import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { DashboardResumo } from '../models/dashboard.model';
import { DespesasService } from './despesas.service';
import { Despesa } from '../models/despesa.model';

export interface DashboardPayload {
  month: string; // YYYY-MM
  summary: DashboardResumo;
  expenses: Despesa[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(
    private http: HttpClient,
    private despesasService: DespesasService
  ) {}

  /**
   * Dashboard em 1 chamada.
   * Backend: GET /api/dashboard?month=YYYY-MM
   */
  getDashboard(ano: number, mes: number): Observable<DashboardPayload> {
    const mm = String(mes).padStart(2, '0');
    const month = `${ano}-${mm}`;
    const params = new HttpParams().set('month', month);

    return this.http.get<DashboardPayload>('/api/dashboard', { params }).pipe(
      map((p) => ({
        month: p?.month ?? month,
        summary: p?.summary,
        expenses: p?.expenses ?? []
      }))
    );
  }

  /**
   * Compat: usado por outras telas (se houver).
   * Mantemos a assinatura e implementamos via payload agregado.
   */
  getResumo(ano: number, mes: number): Observable<DashboardResumo> {
    return this.getDashboard(ano, mes).pipe(map((p) => p.summary));
  }
}
