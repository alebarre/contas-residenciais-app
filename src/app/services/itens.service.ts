import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Item, ItemTipo } from '../models/item.model';

const STORAGE_KEY = 'itens';

@Injectable({ providedIn: 'root' })
export class ItensService {

  private itens: Item[] = this.load();

  private load(): Item[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);

    // Seed inicial (já com atividade)
    return [
      { id: 1, tipo: 'EMPRESA', nome: 'Light (Luz)', atividade: 'Energia elétrica', ativo: true },
      { id: 2, tipo: 'EMPRESA', nome: 'CEDAE (Água)', atividade: 'Abastecimento de água', ativo: true },
      { id: 3, tipo: 'EMPRESA', nome: 'Naturgy (Gás)', atividade: 'Gás encanado', ativo: true },
    ];
  }

  private persist(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.itens));
  }

  listar(): Observable<Item[]> {
    return of([...this.itens]);
  }

  criar(tipo: ItemTipo, nome: string, atividade: string): Observable<Item> {
    const novo: Item = {
      id: Date.now(),
      tipo,
      nome,
      atividade,
      ativo: true
    };
    this.itens.push(novo);
    this.persist();
    return of(novo);
  }

  atualizar(item: Item): Observable<Item> {
    const idx = this.itens.findIndex(i => i.id === item.id);
    if (idx >= 0) {
      this.itens[idx] = { ...item };
      this.persist();
    }
    return of(item);
  }

  excluir(id: number): Observable<void> {
    this.itens = this.itens.filter(i => i.id !== id);
    this.persist();
    return of(void 0);
  }
}
