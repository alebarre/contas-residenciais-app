import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DespesasService } from '../../services/despesas.service';
import { ItensService } from '../../services/itens.service';
import { AuthService } from '../../core/auth/auth.service';
import { Despesa } from '../../models/despesa.model';
import { Item, ItemTipo } from '../../models/item.model';
import { ExportService, ExportTable } from '../../services/export.service';
import { ToastService } from '../../services/toast.service';

type StatusFiltro = 'TODAS' | 'PAGAS' | 'PENDENTES';
type TipoFiltro = 'TODOS' | ItemTipo;

@Component({
  selector: 'app-relatorio-mensal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <div class="header">
        <div>
          <h2>Relatório Mensal</h2>
          <p class="sub">Resumo e listagem por mês</p>
        </div>

        <div class="filters">
          <select [(ngModel)]="ano" (ngModelChange)="reload()">
            <option *ngFor="let a of anosDisponiveis()" [value]="a">{{ a }}</option>
          </select>

          <select [(ngModel)]="mes" (ngModelChange)="reload()">
            <option *ngFor="let m of meses" [value]="m.value">{{ m.label }}</option>
          </select>

          <select [(ngModel)]="status" (ngModelChange)="applyFilters()">
            <option value="TODAS">Todas</option>
            <option value="PAGAS">Pagas</option>
            <option value="PENDENTES">Pendentes</option>
          </select>

          <select [(ngModel)]="tipo" (ngModelChange)="applyFilters()">
            <option value="TODOS">Todos</option>
            <option value="EMPRESA">Empresa</option>
            <option value="PROFISSIONAL">Profissional</option>
            <option value="SERVICO">Serviço</option>
          </select>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div class="kpi">
            <div class="k">Total de registros</div>
            <div class="v">{{ filtradas().length }}</div>
          </div>
          <div class="kpi">
            <div class="k">Total (R$)</div>
            <div class="v">{{ totalValor() | currency:'BRL' }}</div>
          </div>
          <div class="kpi">
            <div class="k">Pagas</div>
            <div class="v">{{ totalPagasQtd() }}</div>
          </div>
          <div class="kpi">
            <div class="k">Pendentes</div>
            <div class="v">{{ totalPendentesQtd() }}</div>
          </div>
        </div>
      </div>

      <div class="table-wrap" *ngIf="filtradas().length; else empty">
        <table>
          <thead>
            <tr>
              <th>Vencimento</th>
              <th>Pagamento</th>
              <th>Tipo</th>
              <th>Item</th>
              <th>Atividade</th>
              <th>Descrição</th>
              <th>Banco</th>
              <th class="right">Valor</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr *ngFor="let d of filtradas()">
              <td>{{ d.dataVencimento | date:'dd/MM/yyyy' }}</td>
              <td>{{ d.dataPagamento | date:'dd/MM/yyyy' }}</td>
              <td>{{ tipoDoItem(d.itemId) }}</td>
              <td>{{ d.itemNome }}</td>
              <td>{{ atividadeDoItem(d.itemId) }}</td>
              <td>{{ d.descricao }}</td>
              <td>{{ d.bancoPagamento }}</td>
              <td class="right">{{ d.valor | currency:'BRL' }}</td>
              <td>{{ d.dataPagamento ? 'Paga' : 'Pendente' }}</td>
            </tr>
          </tbody>
        </table>
        <div class="export">
          <button type="button" class="btn_export" (click)="exportar('txt')">TXT</button>
          <button type="button" class="btn_export" (click)="exportar('pdf')">PDF</button>
          <button type="button" class="btn_export" (click)="exportar('xlsx')">XLSX</button>
        </div>
      </div>

      <ng-template #empty>
        <div class="empty">Nenhuma despesa encontrada para os filtros selecionados.</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .wrap { max-width: 1100px; margin: 0 auto; }
    .header { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; margin-bottom:12px; }
    .sub { margin: 2px 0 0; color:#6b7280; }

    .filters { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    select { padding:10px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; }

    .card { border:1px solid #e5e7eb; border-radius:12px; background:#fff; padding:12px; margin-bottom:12px; }
    .card-head { display:flex; gap:14px; align-items:flex-end; flex-wrap:wrap; justify-content:space-between; }
    .kpi .k { color:#6b7280; font-size:12px; }
    .kpi .v { font-size:18px; font-weight:700; }

    .export { display:flex; gap:8px; padding:12px; justify-content:flex-end; border-top:1px solid #e5e7eb; }
    .btn_export { border:1px solid #e5e7eb; background:#fff; padding:8px 10px; border-radius:10px; cursor:pointer; background-color: #6b7280; color: #fff;}

    .table-wrap { border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; background:#fff; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:10px; border-bottom:1px solid #e5e7eb; vertical-align:top; }
    thead th { background:#f9fafb; text-align:left; }
    .right { text-align:right; }

    .empty { padding:12px; color:#6b7280; text-align:center; border:1px dashed #e5e7eb; border-radius:12px; background:#fff; }
  `]
})
export class RelatorioMensalComponent {
  private despesasService = inject(DespesasService);
  private itensService = inject(ItensService);
  private exportService = inject(ExportService);
  private toast = inject(ToastService);
  private authService = inject(AuthService);

  ano = new Date().getFullYear();
  mes = new Date().getMonth() + 1;

  status: StatusFiltro = 'TODAS';
  tipo: TipoFiltro = 'TODOS';

  despesas = signal<Despesa[]>([]);
  filtradas = signal<Despesa[]>([]);
  itens = signal<Item[]>([]);

  meses = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Fev' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Set' },
    { value: 10, label: 'Out' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dez' }
  ];

  constructor() {
    this.itensService.listar().subscribe(list => this.itens.set(list ?? []));
    this.reload();
  }

  anosDisponiveis(): number[] {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }

  reload(): void {
    this.despesasService.listarPorMes(this.ano, this.mes).subscribe(list => {
      this.despesas.set(list ?? []);
      this.applyFilters();
    });
  }

  applyFilters(): void {
    const base = this.despesas();

    const byStatus = base.filter(d => {
      if (this.status === 'PAGAS') return !!d.dataPagamento;
      if (this.status === 'PENDENTES') return !d.dataPagamento;
      return true;
    });

    const byTipo = byStatus.filter(d => {
      if (this.tipo === 'TODOS') return true;
      return this.tipoDoItem(d.itemId) === this.tipo;
    });

    this.filtradas.set(byTipo);
  }

  tipoDoItem(itemId: string): ItemTipo | '—' {
    return this.itens().find(i => i.id.toString() === String(itemId))?.tipo ?? '—';
  }

  atividadeDoItem(itemId: string): string {
    return this.itens().find(i => i.id.toString() === String(itemId))?.atividade ?? '—';
  }

    exportar(formato: 'txt' | 'pdf' | 'xls' | 'xlsx'): void {
    const mm = String(this.mes).padStart(2, '0');
    const user = this.authService.user?.();
    const table: ExportTable = {
      title: 'Relatório Mensal',
      subtitle: `Mês: ${mm}/${this.ano} | Status: ${this.status} | Tipo: ${this.tipo}`,
      columns: ['Vencimento', 'Pagamento', 'Tipo', 'Item', 'Atividade', 'Descrição', 'Banco', 'Valor (R$)', 'Status'],
      rows: this.filtradas().map(d => ([
        d.dataVencimento,
        d.dataPagamento ?? '',
        this.tipoDoItem(d.itemId),
        d.itemNome,
        this.atividadeDoItem(d.itemId),
        d.descricao,
        d.bancoPagamento ?? '',
        Number(d.valor ?? 0).toFixed(2),
        d.dataPagamento ? 'Paga' : 'Pendente'
      ])),
      pdfHeader: user ? {
        name: user.nome,
        email: user.email,
        analyticsLine: `Contas: ${this.filtradas().length} | Total: R$ ${this.totalValor().toFixed(2)}`
      } : undefined,
      fileBaseName: `relatorio_mensal_${this.ano}_${mm}`
    };

    if (formato === 'txt') return this.exportService.exportTxt(table);
    if (formato === 'pdf') return this.exportService.exportPdf(table);
    if (formato === 'xls' || formato === 'xlsx') return this.exportService.exportXls(table);

    this.toast.error('Formato de exportação não suportado.');
  }

  totalValor = computed(() =>
    this.filtradas().reduce((acc, d) => acc + Number(d.valor ?? 0), 0)
  );

  totalPagasQtd = computed(() =>
    this.filtradas().filter(d => !!d.dataPagamento).length
  );

  totalPendentesQtd = computed(() =>
    this.filtradas().filter(d => !d.dataPagamento).length
  );
}
