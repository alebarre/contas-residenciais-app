import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { StorageService } from '../storage/storage.service';
import { Despesa } from '../../models/despesa.model';
import { DespesasRepository } from './despesas.repository';

type StorageShape = {
  despesas: Despesa[];
  lastId: number;
};

const STORAGE_KEY = 'contas_residenciais';
const DEFAULT_DATA: StorageShape = { despesas: [], lastId: 0 };

@Injectable({ providedIn: 'root' })
export class DespesasLocalRepository implements DespesasRepository {
  constructor(private storage: StorageService) {}

  listarTodas(): Observable<Despesa[]> {
    const data = this.read();
    return of([...data.despesas]);
  }

  listarPorId(id: number): Observable<Despesa | null> {
    const data = this.read();
    const found = data.despesas.find(d => d.id === id) ?? null;
    return of(found);
  }

  salvar(despesa: Despesa): Observable<Despesa> {
    const data = this.read();

    // create
    if (!despesa.id) {
      const newId = (data.lastId ?? 0) + 1;
      const created: Despesa = { ...despesa, id: newId };
      data.lastId = newId;
      data.despesas = [created, ...data.despesas];
      this.write(data);
      return of(created);
    }

    // update
    data.despesas = data.despesas.map(d => (d.id === despesa.id ? { ...despesa } : d));
    this.write(data);
    return of({ ...despesa });
  }

  remover(id: number): Observable<void> {
    const data = this.read();
    data.despesas = data.despesas.filter(d => d.id !== id);
    this.write(data);
    return of(void 0);
  }

  private read(): StorageShape {
    return this.storage.get<StorageShape>(STORAGE_KEY, DEFAULT_DATA);
  }

  private write(data: StorageShape): void {
    this.storage.set(STORAGE_KEY, data);
  }
}
