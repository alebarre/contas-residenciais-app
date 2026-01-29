import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Item } from '../models/item.model';

@Injectable({ providedIn: 'root' })
export class ItensService {
  private itens: Item[] = [
    { id: 1, tipo: 'EMPRESA', nome: 'Light (Luz)', ativo: true },
    { id: 2, tipo: 'EMPRESA', nome: 'CEDAE (Água)', ativo: true },
    { id: 3, tipo: 'EMPRESA', nome: 'Naturgy (Gás)', ativo: true },
    { id: 4, tipo: 'SERVICO', nome: 'Jardinagem', ativo: true },
    { id: 5, tipo: 'PROFISSIONAL', nome: 'Fisioterapeuta', ativo: true },
  ];

  listar(): Observable<Item[]> {
    return of([...this.itens]);
  }
}
