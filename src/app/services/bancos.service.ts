import { Injectable } from '@angular/core';
import { Observable, of, map, switchMap, tap, catchError } from 'rxjs';
import { Banco } from '../models/banco.model';
import { BancosCatalogApi } from '../data/bancos/bancos-catalog.api';

@Injectable({ providedIn: 'root' })
export class BancosService {
  private inactiveCodes: number[] = [];

  constructor(private api: BancosCatalogApi) {
    // carrega overrides uma vez para a UI
    this.api.getOverrides().subscribe({
      next: (o) => (this.inactiveCodes = o?.inactiveCodes ?? []),
      error: () => (this.inactiveCodes = [])
    });
  }

  listarTodos(q?: string): Observable<Banco[]> {
    return this.api.list(false, q).pipe(
      map((list) => (list ?? []).slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')))
    );
  }

  listarAtivos(q?: string): Observable<Banco[]> {
    return this.api.list(true, q).pipe(
      map((list) => (list ?? []).slice().sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')))
    );
  }

  atualizarAgora(): Observable<Banco[]> {
    return this.api.refresh().pipe(
      switchMap(() => this.listarTodos()),
      catchError(() => this.listarTodos())
    );
  }

  refreshOverrides(): Observable<number[]> {
    return this.api.getOverrides().pipe(
      map((o) => o?.inactiveCodes ?? []),
      tap((list) => (this.inactiveCodes = list)),
      catchError(() => {
        this.inactiveCodes = [];
        return of([]);
      })
    );
  }

  isInativo(code: number): boolean {
    return (this.inactiveCodes ?? []).includes(code);
  }

  inativar(code: number): Observable<void> {
    const c = Number(code);
    if (!c || c <= 0) return of(void 0);

    return this.api.inactivate(c).pipe(
      tap(() => {
        this.inactiveCodes = Array.from(new Set([...(this.inactiveCodes ?? []), c])).sort((a, b) => a - b);
      })
    );
  }

  reativar(code: number): Observable<void> {
    const c = Number(code);
    if (!c || c <= 0) return of(void 0);

    return this.api.reactivate(c).pipe(
      tap(() => {
        this.inactiveCodes = (this.inactiveCodes ?? []).filter((x) => x !== c);
      })
    );
  }

  inativarEmLote(codes: number[]): Observable<void> {
    const distinct = Array.from(
      new Set((codes ?? []).map(Number).filter((c) => Number.isFinite(c) && c > 0))
    );
    if (distinct.length === 0) return of(void 0);

    return this.api.bulkInactivate(distinct).pipe(
      tap(() => {
        this.inactiveCodes = Array.from(new Set([...(this.inactiveCodes ?? []), ...distinct])).sort((a, b) => a - b);
      })
    );
  }

  reativarEmLote(codes: number[]): Observable<void> {
    const distinct = Array.from(
      new Set((codes ?? []).map(Number).filter((c) => Number.isFinite(c) && c > 0))
    );
    if (distinct.length === 0) return of(void 0);

    return this.api.bulkReactivate(distinct).pipe(
      tap(() => {
        const set = new Set(distinct);
        this.inactiveCodes = (this.inactiveCodes ?? []).filter((c) => !set.has(c));
      })
    );
  }

  inativarTodos(): Observable<void> {
    return this.api.inactivateAll().pipe(
      tap(() => {
        // após inativar tudo, sincroniza overrides (garante UI consistente)
        this.refreshOverrides().subscribe();
      })
    );
  }

  reativarTodos(): Observable<void> {
    return this.api.reactivateAll().pipe(
      tap(() => {
        this.inactiveCodes = [];
      })
    );
  }


}
