import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Banco } from '../../models/banco.model';

@Injectable({ providedIn: 'root' })
export class BancosCatalogApi {
  private readonly url = 'https://brasilapi.com.br/api/banks/v1';

  constructor(private http: HttpClient) {}

  fetchAll(): Observable<Banco[]> {
    return this.http.get<Banco[]>(this.url);
  }
}
