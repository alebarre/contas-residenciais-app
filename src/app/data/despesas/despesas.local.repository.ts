import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { AppStorageService } from '../storage/app-storage.service';
import { Despesa } from '../../models/despesa.model';
import { DespesasRepository } from './despesas.repository';

@Injectable({ providedIn: 'root' })
export class DespesasLocalRepository implements DespesasRepository {
  constructor(private appStorage: AppStorageService) {}

  listarTodas(): Observable<Despesa[]> {
    const all = this.appStorage.getAll();
    return of([...(all.despesas ?? [])]);
  }

  listarPorId(id: number): Observable<Despesa | null> {
    const all = this.appStorage.getAll();
    const found = (all.despesas ?? []).find(d => d.id === id) ?? null;
    return of(found);
  }

  salvar(despesa: Despesa): Observable<Despesa> {
    const all = this.appStorage.getAll();
    const despesas = [...(all.despesas ?? [])];
    const lastIds = this.appStorage.getLastIds();

    // create
    if (!despesa.id) {
      const newId = (lastIds.despesa ?? 0) + 1;
      const created: Despesa = { ...despesa, id: newId };
      lastIds.despesa = newId;
      const next = [created, ...despesas];
      this.appStorage.setDespesas(next);
      this.appStorage.setLastIds(lastIds);
      return of(created);
    }

    // update
    const next = despesas.map(d => (d.id === despesa.id ? { ...despesa } : d));
    this.appStorage.setDespesas(next);
    return of({ ...despesa });
  }

  remover(id: number): Observable<void> {
    const all = this.appStorage.getAll();
    const next = (all.despesas ?? []).filter(d => d.id !== id);
    this.appStorage.setDespesas(next);
    return of(void 0);
  }
}
