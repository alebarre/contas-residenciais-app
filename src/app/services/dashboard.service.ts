import { Injectable } from '@angular/core';
import { Observable, forkJoin, map } from 'rxjs';
import { DashboardResumo } from '../models/dashboard.model';
import { DespesasService } from './despesas.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private despesasService: DespesasService) {}

  getResumo(ano: number, mes: number): Observable<DashboardResumo> {
    return this.despesasService.listarPorMes(ano, mes).pipe(
      map(despesasDoMes => {
        const contasDoMes = despesasDoMes.length;
        const totalPagoNoMes = despesasDoMes.reduce((acc, d) => acc + (d.valor ?? 0), 0);

        const maior = despesasDoMes.reduce<{ itemNome: string; valor: number } | undefined>((best, d) => {
          const v = d.valor ?? 0;
          if (!best || v > best.valor) return { itemNome: d.itemNome, valor: v };
          return best;
        }, undefined);

        // histórico anual: soma por mês (1..12)
        const historicoMensal = Array.from({ length: 12 }).map((_, i) => ({ mes: i + 1, total: 0 }));

        // Para não abrir o storage diretamente aqui (mantemos simples):
        // Vamos montar o histórico pedindo mês a mês do service.
        // Como é mock/local e leve, isso é ok por enquanto.
        // (Quando houver backend, isso vira 1 endpoint de resumo anual.)
        // Aqui fazemos de forma síncrona com calls encadeadas no próximo passo (abaixo).

        return {
          contasDoMes,
          maiorDespesaDoMes: maior,
          totalPagoNoMes,
          historicoMensal
        };
      })
    );
  }

  // ✅ novo método: histórico anual real (12 meses)
  getHistoricoAnual(ano: number): Observable<Array<{ mes: number; total: number }>> {
    const requests = Array.from({ length: 12 }, (_, i) => {
      const mes = i + 1;
      return this.despesasService.listarPorMes(ano, mes).pipe(
        map(list => list.reduce((acc, d) => acc + (d.valor ?? 0), 0))
      );
    });

    return forkJoin(requests).pipe(
      map(totais => totais.map((total, idx) => ({ mes: idx + 1, total })))
    );
  }
}
