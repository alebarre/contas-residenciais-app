import { Observable } from 'rxjs';
import { Despesa } from '../../models/despesa.model';

export interface DespesasRepository {
  listarTodas(): Observable<Despesa[]>;
  listarPorId(id: number): Observable<Despesa | null>;
  salvar(despesa: Despesa): Observable<Despesa>;         // cria ou atualiza
  remover(id: number): Observable<void>;
}
