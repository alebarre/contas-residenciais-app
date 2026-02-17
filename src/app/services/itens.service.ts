import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Item } from '../models/item.model';

export type ItemTipo = 'EMPRESA' | 'PROFISSIONAL' | 'SERVICO';

@Injectable({ providedIn: 'root' })
export class ItensService {
  constructor(private http: HttpClient) {}

  listar(params?: { onlyActive?: boolean; tipo?: ItemTipo }): Observable<Item[]> {
    let httpParams = new HttpParams();

    if (params?.onlyActive !== undefined) {
      httpParams = httpParams.set('onlyActive', String(params.onlyActive));
    }
    if (params?.tipo) {
      httpParams = httpParams.set('tipo', params.tipo);
    }

    return this.http.get<Item[]>('/api/items', { params: httpParams }).pipe(
      map((list) => list ?? [])
    );
  }

  criar(tipo: string, nome: string, atividade: string, payload: { tipo: ItemTipo; nome: string; atividade: string; }): Observable<Item> {
    return this.http.post<Item>('/api/items', payload);
  }

  atualizar(
    id: string,
    payload: Partial<{ tipo: ItemTipo; nome: string; atividade: string }>
  ): Observable<Item> {
    return this.http.patch<Item>(`/api/items/${id}`, payload);
  }

  ativar(id: string): Observable<Item> {
    return this.http.patch<Item>(`/api/items/${id}/activate`, {});
  }

  inativar(id: string): Observable<Item> {
    return this.http.patch<Item>(`/api/items/${id}/deactivate`, {});
  }
}
