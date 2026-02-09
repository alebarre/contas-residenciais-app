import { Injectable } from '@angular/core';
import { Observable, of, map, switchMap, tap, catchError } from 'rxjs';
import { Banco } from '../models/banco.model';
import { BancosCatalogApi } from '../data/bancos/bancos-catalog.api';
import { AppStorageService } from '../data/storage/app-storage.service';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable({ providedIn: 'root' })
export class BancosService {
  constructor(private api: BancosCatalogApi, private appStorage: AppStorageService) {}

  /** Catálogo completo (cacheado e atualizado automaticamente se passou de 24h). */
  listarTodos(): Observable<Banco[]> {
    return this.getCachedOrFetchIfNeeded().pipe(
      map(list => [...list].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '')))
    );
  }

  /** Bancos ativos no app = catálogo - inativos localmente (override). */
  listarAtivos(): Observable<Banco[]> {
    return this.listarTodos().pipe(
      map(list => {
        const inactive = new Set(this.appStorage.getBanksOverrides().inactiveCodes);
        return list.filter(b => !inactive.has(b.code));
      })
    );
  }

  /** Força refresh do catálogo (botão "Atualizar agora"). */
  atualizarAgora(): Observable<Banco[]> {
    return this.api.fetchAll().pipe(
      tap(list => this.setCache(list)),
      catchError(() => of(this.appStorage.getBanksCache()?.data ?? []))
    );
  }

  inativar(code: number): void {
    const current = this.appStorage.getBanksOverrides().inactiveCodes;
    const next = Array.from(new Set([...current, code])).sort((a, b) => a - b);
    this.appStorage.setBanksOverrides({ inactiveCodes: next });
  }

  reativar(code: number): void {
    const current = this.appStorage.getBanksOverrides().inactiveCodes;
    this.appStorage.setBanksOverrides({ inactiveCodes: current.filter(c => c !== code) });
  }

  isInativo(code: number): boolean {
    return this.appStorage.getBanksOverrides().inactiveCodes.includes(code);
  }

  getByCode(code: number): Observable<Banco | null> {
    return this.listarTodos().pipe(map(list => list.find(b => b.code === code) ?? null));
  }

  // ---------- internals ----------

  private getCachedOrFetchIfNeeded(): Observable<Banco[]> {
    const cache = this.appStorage.getBanksCache();
    if (cache?.data?.length && cache.updatedAt) {
      const age = Date.now() - Date.parse(cache.updatedAt);
      if (!Number.isNaN(age) && age < ONE_DAY_MS) return of(cache.data);
    }

    return this.api.fetchAll().pipe(
      tap(list => this.setCache(list)),
      catchError(() => of(cache?.data ?? []))
    );
  }

  private setCache(list: Banco[]): void {
    this.appStorage.setBanksCache({ updatedAt: new Date().toISOString(), data: list ?? [] });
  }
}
