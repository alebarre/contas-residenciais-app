import { Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { Despesa } from '../models/despesa.model';
import { DespesasLocalRepository } from '../data/despesas/despesas.local.repository';

@Injectable({ providedIn: 'root' })
export class DespesasService {
  constructor(private repo: DespesasLocalRepository) {}

  // -----------------------------
  // API "nova" (fachada)
  // -----------------------------

  listarTodas(): Observable<Despesa[]> {
    return this.repo.listarTodas().pipe(
      map(list => this.ordenarPorVencimentoDesc(list))
    );
  }

  listarPorMes(ano: number, mes: number): Observable<Despesa[]> {
    return this.listarTodas().pipe(
      map(list => list.filter(d => this.isMesAno(d.dataVencimento, ano, mes)))
    );
  }

  salvar(despesa: Despesa): Observable<Despesa> {
    this.validar(despesa);
    return this.repo.salvar(despesa);
  }

  remover(id: number): Observable<void> {
    return this.repo.remover(id);
  }

  marcarComoPaga(id: number, dataPagamentoISO: string): Observable<Despesa> {
    return this.repo.listarPorId(id).pipe(
      map(d => {
        if (!d) throw new Error('Despesa não encontrada');
        return { ...d, dataPagamento: dataPagamentoISO };
      }),
      switchMap(updated => this.repo.salvar(updated))
    );
  }

  desmarcarPagamento(id: number): Observable<Despesa> {
    return this.repo.listarPorId(id).pipe(
      map(d => {
        if (!d) throw new Error('Despesa não encontrada');
        return { ...d, dataPagamento: undefined };
      }),
      switchMap(updated => this.repo.salvar(updated))
    );
  }

  // -----------------------------
  // ✅ Compatibilidade (contrato antigo das telas)
  // -----------------------------

  criar(despesa: Omit<Despesa, 'id'>): Observable<Despesa> {
    // garante que é criação (sem id)
    return this.salvar({ ...(despesa as Despesa), id: 0 });
  }

  atualizar(despesa: Despesa): Observable<Despesa> {
    // update exige id
    if (!despesa.id) throw new Error('Id é obrigatório para atualizar');
    return this.salvar(despesa);
  }

  excluir(id: number): Observable<void> {
    return this.remover(id);
  }

  existeVinculoComItem(itemId: number): Observable<boolean> {
    // regra: existe vínculo se alguma despesa referencia o itemId
    // Ajuste aqui se o seu model usar outro campo (ex.: itemId, item?.id, etc.)
    return this.repo.listarTodas().pipe(
      map(list => list.some(d => d.itemId === itemId))
    );
  }

  // -----------------------------
  // Regras utilitárias
  // -----------------------------

  private validar(d: Despesa): void {
    if (!d.descricao?.trim()) throw new Error('Descrição é obrigatória');
    if (d.valor == null || d.valor <= 0) throw new Error('Valor deve ser maior que zero');
    if (!d.dataVencimento) throw new Error('Data de vencimento é obrigatória');
  }

  private isMesAno(dateISO: string, ano: number, mes: number): boolean {
    // dateISO esperado: yyyy-MM-dd
    const [y, m] = dateISO.split('-').map(Number);
    return y === ano && m === mes;
  }

  private ordenarPorVencimentoDesc(list: Despesa[]): Despesa[] {
    return [...list].sort((a, b) => (b.dataVencimento ?? '').localeCompare(a.dataVencimento ?? ''));
  }
}
