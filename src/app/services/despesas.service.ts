import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Despesa } from '../models/despesa.model';

const STORAGE_KEY = 'despesas';

@Injectable({ providedIn: 'root' })
export class DespesasService {
  private despesas: Despesa[] = this.load();

  private load(): Despesa[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.despesas));
  }

  listarPorMes(ano: number, mes: number): Observable<Despesa[]> {
    const mm = String(mes).padStart(2, '0');
    const prefix = `${ano}-${mm}`;

    const list = this.despesas
      .filter(d => (d.dataVencimento ?? '').startsWith(prefix))
      .sort((a, b) => (a.dataVencimento || '').localeCompare(b.dataVencimento || ''));

    return of(list);
  }

  // ✅ usado no bloqueio de inativação de item
  existeVinculoComItem(itemId: number): Observable<boolean> {
    return of(this.despesas.some(d => d.itemId === itemId));
  }

  criar(d: Omit<Despesa, 'id'>): Observable<Despesa> {
    const novo: Despesa = { ...d, id: Date.now() };
    this.despesas.push(novo);
    this.persist();
    return of(novo);
  }

  atualizar(d: Despesa): Observable<Despesa> {
    const idx = this.despesas.findIndex(x => x.id === d.id);
    if (idx >= 0) {
      this.despesas[idx] = { ...d };
      this.persist();
    }
    return of(d);
  }

  excluir(id: number): Observable<void> {
    this.despesas = this.despesas.filter(d => d.id !== id);
    this.persist();
    return of(void 0);
  }
}
