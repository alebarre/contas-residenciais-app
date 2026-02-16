import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Banco } from '../../models/banco.model';

@Injectable({ providedIn: 'root' })
export class BancosCatalogApi {
  constructor(private http: HttpClient) {}

  list(onlyActive: boolean, q?: string): Observable<Banco[]> {
    let params = new HttpParams().set('onlyActive', String(onlyActive));
    if (q?.trim()) params = params.set('q', q.trim());
    return this.http.get<Banco[]>('/api/banks', { params });
  }

  getOverrides(): Observable<{ inactiveCodes: number[] }> {
    return this.http.get<{ inactiveCodes: number[] }>('/api/banks/overrides');
  }

  inactivate(code: number): Observable<void> {
    return this.http.post<void>(`/api/banks/overrides/${code}/inactivate`, {});
  }

  reactivate(code: number): Observable<void> {
    return this.http.delete<void>(`/api/banks/overrides/${code}/inactivate`);
  }

  reactivateAll() {
    return this.http.post<void>('/api/banks/overrides/reactivate-all', {});
  }

  bulkInactivate(codes: number[]): Observable<void> {
    return this.http.post<void>('/api/banks/overrides/bulk/inactivate', { codes });
  }

  bulkReactivate(codes: number[]) {
    return this.http.post<void>('/api/banks/overrides/bulk/reactivate', { codes });
  }

  inactivateAll() {
    return this.http.post<void>('/api/banks/overrides/inactivate-all', {});
  }

  refresh(): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>('/api/banks/refresh', {});
  }
}
