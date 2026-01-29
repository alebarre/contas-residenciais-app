import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DespesasService } from '../../services/despesas.service';
import { DashboardResumo } from '../../models/dashboard.model';
import { Despesa } from '../../models/despesa.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="header">
      <div>
        <h2>Dashboard</h2>
        <p class="sub">Resumo de {{ mesLabel() }}/{{ ano() }}</p>
      </div>

      <div class="actions">
        <div class="filters">
          <button type="button" class="btn" (click)="prevMonth()">◀</button>
          <div class="chip">{{ mesLabel() }}/{{ ano() }}</div>
          <button type="button" class="btn" (click)="nextMonth()">▶</button>
        </div>

        <button type="button" class="btn primary" (click)="novaDespesa()">+ Nova despesa</button>
      </div>
    </div>

    <section class="cards" *ngIf="resumo() as r">
      <div class="card">
        <div class="k">Contas do mês</div>
        <div class="v">{{ r.contasDoMes }}</div>
      </div>

      <div class="card">
        <div class="k">Maior despesa no mês</div>
        <div class="v" *ngIf="r.maiorDespesaDoMes as m">
          {{ m.itemNome }}
          <span class="muted">— {{ m.valor | currency:'BRL' }}</span>
        </div>
        <div class="v" *ngIf="!r.maiorDespesaDoMes">—</div>
      </div>

      <div class="card">
        <div class="k">Total geral pago</div>
        <div class="v">{{ r.totalPagoNoMes | currency:'BRL' }}</div>
      </div>

      <div class="card">
        <div class="k">Histórico ao longo de {{ ano() }}</div>
        <div class="v small">
          <div class="bars">
            <div
              class="bar"
              *ngFor="let p of r.historicoMensal"
              [title]="p.mes + ': ' + (p.total | currency:'BRL')"
              [style.height.%]="barHeight(p.total, r.historicoMensal)"
            ></div>
          </div>
          <div class="muted tiny">Mock visual (vamos trocar por gráfico depois)</div>
        </div>
      </div>
    </section>

    <section class="list">
      <div class="list-header">
        <h3>Contas cadastradas no mês</h3>
        <div class="muted">{{ despesas().length }} registro(s)</div>
      </div>

      <div class="table-wrap" *ngIf="despesas().length; else empty">
        <table>
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Pagamento</th>
              <th>Item</th>
              <th>Descrição</th>
              <th>Banco</th>
              <th class="right">Valor</th>
              <th class="right">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of despesas()">
              <td>{{ d.dataVencimento }}</td>
              <td>{{ d.dataPagamento }}</td>
              <td>{{ d.itemNome }}</td>
              <td>{{ d.descricao }}</td>
              <td>{{ d.bancoPagamento }}</td>
              <td class="right">{{ d.valor | currency:'BRL' }}</td>
              <td class="right">
                <button type="button" class="btn-sm" disabled>Editar</button>
                <button type="button" class="btn-sm danger" disabled>Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #empty>
        <div class="empty">
          Nenhuma despesa cadastrada em {{ mesLabel() }}/{{ ano() }}.
        </div>
      </ng-template>
    </section>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }

    h2 { margin: 0; }
    .sub { margin: 2px 0 0; color: #6b7280; }

    .actions { display: flex; align-items: center; gap: 10px; }
    .filters { display: flex; align-items: center; gap: 8px; }

    .chip {
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 999px;
      background: #fff;
      min-width: 110px;
      text-align: center;
    }

    .btn {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 8px 10px;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
    }

    .btn.primary {
      background: #111827;
      color: #fff;
      border-color: #111827;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      background: #fff;
      min-height: 92px;
    }

    .k { color: #6b7280; font-size: 12px; margin-bottom: 6px; }
    .v { font-size: 18px; font-weight: 700; }
    .v.small { font-size: 14px; font-weight: 600; }
    .muted { color: #6b7280; font-weight: 500; }
    .tiny { font-size: 12px; font-weight: 500; margin-top: 6px; }

    .bars {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 4px;
      align-items: end;
      height: 48px;
      margin-top: 6px;
    }

    .bar {
      width: 100%;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
      background: #f9fafb;
      min-height: 4px;
    }

    .list {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fff;
      padding: 12px;
    }

    .list-header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }

    h3 { margin: 0; }

    .table-wrap { overflow: auto; border: 1px solid #e5e7eb; border-radius: 10px; }
    table { width: 100%; border-collapse: collapse; min-width: 760px; }
    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    thead th { background: #f9fafb; font-size: 12px; color: #374151; }
    .right { text-align: right; }

    .btn-sm {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 6px 8px;
      border-radius: 10px;
      cursor: not-allowed;
      margin-left: 6px;
      white-space: nowrap;
    }

    .btn-sm.danger { border-color: #fecaca; }

    .empty {
      padding: 14px;
      color: #6b7280;
      border: 1px dashed #e5e7eb;
      border-radius: 10px;
      background: #fafafa;
    }

    @media (max-width: 1100px) {
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 640px) {
      .header { flex-direction: column; align-items: stretch; }
      .actions { flex-direction: column; align-items: stretch; }
      .filters { justify-content: space-between; }
      .cards { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent {
  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private despesasService = inject(DespesasService);

  private now = new Date();
  ano = signal(this.now.getFullYear());
  mes = signal(this.now.getMonth() + 1); // 1..12

  resumo = signal<DashboardResumo | null>(null);
  despesas = signal<Despesa[]>([]);

  mesLabel = computed(() => {
    const m = this.mes();
    const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return nomes[m - 1] ?? String(m);
  });

  constructor() {
    this.reload();
  }

  novaDespesa(): void {
    this.router.navigateByUrl('despesas/nova');
  }

  reload(): void {
    const ano = this.ano();
    const mes = this.mes();

    this.dashboardService.getResumo(ano, mes).subscribe(r => this.resumo.set(r));
    this.despesasService.listarPorMes(ano, mes).subscribe(list => this.despesas.set(list));
  }

  prevMonth(): void {
    let a = this.ano();
    let m = this.mes() - 1;
    if (m < 1) { m = 12; a -= 1; }
    this.ano.set(a);
    this.mes.set(m);
    this.reload();
  }

  nextMonth(): void {
    let a = this.ano();
    let m = this.mes() + 1;
    if (m > 12) { m = 1; a += 1; }
    this.ano.set(a);
    this.mes.set(m);
    this.reload();
  }

  barHeight(value: number, historico: Array<{ mes: number; total: number }>): number {
    const max = Math.max(...historico.map(h => h.total), 0);
    if (max <= 0) return 5; // mínimo visual
    const pct = (value / max) * 100;
    return Math.max(5, Math.round(pct));
  }
}
