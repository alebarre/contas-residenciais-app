import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Item, ItemTipo } from '../models/item.model';
import { AppStorageService } from '../data/storage/app-storage.service';

@Injectable({ providedIn: 'root' })
export class ItensService {
  private itens: Item[];

  constructor(private appStorage: AppStorageService) {
    // garante seed + migração (feito no AppStorageService)
    this.itens = this.ensureSeed(this.appStorage.getItens());
    this.persist();
  }

  private ensureSeed(current: Item[]): Item[] {
    if (current?.length) return current;

    return [
      { id: 1, tipo: 'EMPRESA', nome: 'Light (Luz)', atividade: 'Energia elétrica', ativo: true },
      { id: 2, tipo: 'EMPRESA', nome: 'CEDAE (Água)', atividade: 'Abastecimento de água', ativo: true },
      { id: 3, tipo: 'EMPRESA', nome: 'Naturgy (Gás)', atividade: 'Gás encanado', ativo: true },
    ];
  }

  private persist(): void {
    this.appStorage.setItens(this.itens);
    // manter lastIds.item coerente
    const lastIds = this.appStorage.getLastIds();
    const maxId = this.itens.reduce((m, i) => (i.id > m ? i.id : m), 0);
    if (maxId > (lastIds.item ?? 0)) {
      this.appStorage.setLastIds({ ...lastIds, item: maxId });
    }
  }

  listar(): Observable<Item[]> {
    return of([...this.itens]);
  }

  criar(tipo: ItemTipo, nome: string, atividade: string): Observable<Item> {
    const lastIds = this.appStorage.getLastIds();
    const newId = (lastIds.item ?? 0) + 1;
    const novo: Item = { id: newId, tipo, nome, atividade, ativo: true };
    this.itens.push(novo);
    this.appStorage.setLastIds({ ...lastIds, item: newId });
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

  // ✅ Soft delete
  inativar(id: number): Observable<void> {
    const idx = this.itens.findIndex(i => i.id === id);
    if (idx >= 0) {
      this.itens[idx] = { ...this.itens[idx], ativo: false };
      this.persist();
    }
    return of(void 0);
  }

  // ✅ Reativar
  ativar(id: number): Observable<void> {
    const idx = this.itens.findIndex(i => i.id === id);
    if (idx >= 0) {
      this.itens[idx] = { ...this.itens[idx], ativo: true };
      this.persist();
    }
    return of(void 0);
  }
}
