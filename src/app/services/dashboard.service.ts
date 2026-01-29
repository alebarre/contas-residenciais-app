import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { DashboardResumo } from '../models/dashboard.model';
import { DespesasService } from './despesas.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  constructor(private despesasService: DespesasService) {}

  getResumo(ano: number, mes: number): Observable<DashboardResumo> {
    // mock “inteligente”: calcula a partir das despesas
    return this.despesasService.listarPorMes(ano, mes).pipe(
      map(despesas => {
        const contasDoMes = despesas.length;
        const totalPagoNoMes = despesas.reduce((acc, d) => acc + d.valor, 0);

        const maior = despesas.reduce<{ itemNome: string; valor: number } | undefined>((best, d) => {
          if (!best || d.valor > best.valor) return { itemNome: d.itemNome, valor: d.valor };
          return best;
        }, undefined);

        // histórico mock (12 meses) — depois vem do backend
        const historicoMensal = Array.from({ length: 12 }).map((_, i) => {
          const m = i + 1;
          const total = m === mes ? totalPagoNoMes : 0;
          return { mes: m, total };
        });

        return {
          contasDoMes,
          maiorDespesaDoMes: maior,
          totalPagoNoMes,
          historicoMensal
        };
      })
    );
  }
}
