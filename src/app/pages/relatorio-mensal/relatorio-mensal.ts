import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DespesasService } from '../../services/despesas.service';
import { ItensService } from '../../services/itens.service';
import { Despesa } from '../../models/despesa.model';
import { Item, ItemTipo } from '../../models/item.model';
import { ExportService, ExportTable } from '../../services/export.service';


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
            <option value="TODOS">Todos os tipos</option>
            <option value="EMPRESA">Empresa</option>
            <option value="PROFISSIONAL">Profissional</option>
            <option value="SERVICO">Serviço</option>
          </select>
        </div>
      </div>

      <section class="kpis">
        <div class="kpi">
          <div class="k">Total (mês)</div>
          <div class="v">{{ totalQtd() }}</div>
          <div class="muted">{{ totalValor() | currency:'BRL' }}</div>
        </div>

        <div class="kpi paid">
          <div class="k">Pagas</div>
          <div class="v">{{ pagasQtd() }}</div>
          <div class="muted">{{ pagasValor() | currency:'BRL' }}</div>
        </div>

        <div class="kpi pending">
          <div class="k">Pendentes</div>
          <div class="v">{{ pendentesQtd() }}</div>
          <div class="muted">{{ pendentesValor() | currency:'BRL' }}</div>
        </div>
      </section>

      <section class="list">
        <div class="list-header">
          <h3>Despesas do mês</h3>
          <div class="muted">{{ filtradas().length }} registro(s)</div>
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
                <th class="right">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let d of filtradas()"
                  [class.row-paid]="!!d.dataPagamento"
                  [class.row-pending]="!d.dataPagamento">
                <td>{{ d.dataVencimento }}</td>
                <td>{{ d.dataPagamento || '-' }}</td>
                <td>{{ tipoDoItem(d.itemId) }}</td>
                <td>{{ d.itemNome }}</td>
                <td>{{ atividadeDoItem(d.itemId) }}</td>
                <td>{{ d.descricao }}</td>
                <td>{{ d.bancoPagamento }}</td>
                <td class="right">{{ d.valor | currency:'BRL' }}</td>
                <td class="right">{{ d.dataPagamento ? 'Paga' : 'Pendente' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="export">
          <button type="button" class="btn" (click)="exportar('txt')">TXT</button>
          <button type="button" class="btn" (click)="exportar('pdf')">PDF</button>
          <button type="button" class="btn" (click)="exportar('xls')">XLS</button>
        </div>


        <ng-template #empty>
          <div class="empty">Nenhuma despesa encontrada com os filtros atuais.</div>
        </ng-template>
      </section>
    </div>
  `,
  styles: [`
    .wrap { max-width: 1200px; margin: 0 auto; }

    .header {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }

    h2 { margin: 0; }
    .sub { margin: 2px 0 0; color: #6b7280; }

    .filters { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
    select {
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
      min-width: 160px;
    }

    .kpis {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 14px;
    }

    .kpi {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      background: #fff;
      min-height: 86px;
    }

    .kpi.paid { background: #f0fdf4; border-color: #bbf7d0; }
    .kpi.pending { background: #fffbeb; border-color: #fde68a; }

    .k { color: #6b7280; font-size: 12px; margin-bottom: 6px; }
    .v { font-size: 18px; font-weight: 800; }
    .muted { color: #6b7280; font-weight: 500; }

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
    table { width: 100%; border-collapse: collapse; min-width: 980px; }
    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; }
    thead th { background: #f9fafb; font-size: 12px; color: #374151; }
    .right { text-align: right; }

    .row-paid { background: #f0fdf4; }
    .row-pending { background: #fffbeb; }

    .empty {
      padding: 14px;
      color: #6b7280;
      border: 1px dashed #e5e7eb;
      border-radius: 10px;
      background: #fafafa;
    }

    .export { display: flex; gap: 8px; justify-content: flex-end; }

    .btn {

      font-size: 14px;
      font-weight: 800;
      color: #fff;
      margin: 10px 5px 5px 0;
      border: 1px solid #e5e7eb;
      background: #cab6a2;
      padding: 10px 12px;
      border-radius: 10px;
      cursor: pointer;
    }


    @media (max-width: 900px) {
      .header { flex-direction: column; align-items: stretch; }
      .filters { justify-content: flex-start; }
      .kpis { grid-template-columns: 1fr; }
    }
  `]
})
export class RelatorioMensalComponent {
  private despesasService = inject(DespesasService);
  private itensService = inject(ItensService);
  private exportService = inject(ExportService);

  private now = new Date();
  ano = this.now.getFullYear();
  mes = this.now.getMonth() + 1;

  status: StatusFiltro = 'TODAS';
  tipo: TipoFiltro = 'TODOS';

  meses = [
    { value: 1, label: 'Jan' }, { value: 2, label: 'Fev' }, { value: 3, label: 'Mar' },
    { value: 4, label: 'Abr' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Jun' },
    { value: 7, label: 'Jul' }, { value: 8, label: 'Ago' }, { value: 9, label: 'Set' },
    { value: 10, label: 'Out' }, { value: 11, label: 'Nov' }, { value: 12, label: 'Dez' },
  ];

  itens = signal<Item[]>([]);
  despesas = signal<Despesa[]>([]);
  filtradas = signal<Despesa[]>([]);

  anosDisponiveis = computed(() => {
    const y = this.now.getFullYear();
    return [y - 1, y, y + 1];
  });

  constructor() {
    this.itensService.listar().subscribe(list => this.itens.set(list));
    this.reload();
  }

  reload(): void {
    this.despesasService.listarPorMes(this.ano, this.mes).subscribe(list => {
      this.despesas.set(list);
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

  tipoDoItem(itemId: number): ItemTipo | '—' {
    return this.itens().find(i => i.id === itemId)?.tipo ?? '—';
  }

  atividadeDoItem(itemId: number): string {
    return this.itens().find(i => i.id === itemId)?.atividade ?? '—';
  }

  exportar(formato: 'txt' | 'pdf' | 'xls'): void {
    const rows = this.filtradas();

    const table: ExportTable = {
      title: 'Relatório Mensal',
      subtitle: `Ano/Mês: ${this.ano}-${String(this.mes).padStart(2, '0')} | Status: ${this.status} | Tipo: ${this.tipo}`,
      columns: ['Vencimento', 'Pagamento', 'Tipo', 'Item', 'Atividade', 'Descrição', 'Banco', 'Valor (R$)', 'Status'],
      rows: rows.map(d => ([
        d.dataVencimento,
        d.dataPagamento || '',
        this.tipoDoItem(d.itemId),
        d.itemNome,
        this.atividadeDoItem(d.itemId),
        d.descricao,
        d.bancoPagamento,
        Number(d.valor ?? 0).toFixed(2),
        d.dataPagamento ? 'Paga' : 'Pendente'
      ])),
      fileBaseName: `relatorio_mensal_${this.ano}_${String(this.mes).padStart(2, '0')}`
    };

    if (formato === 'txt') this.exportService.exportTxt(table);
    if (formato === 'pdf') this.exportService.exportPdf(table);
    if (formato === 'xls') this.exportService.exportXls(table);
  }


  totalQtd = computed(() => this.filtradas().length);
  totalValor = computed(() => this.filtradas().reduce((acc, d) => acc + (d.valor ?? 0), 0));

  pagasQtd = computed(() => this.filtradas().filter(d => !!d.dataPagamento).length);
  pendentesQtd = computed(() => this.filtradas().filter(d => !d.dataPagamento).length);

  pagasValor = computed(() => this.filtradas().filter(d => !!d.dataPagamento).reduce((acc, d) => acc + (d.valor ?? 0), 0));
  pendentesValor = computed(() => this.filtradas().filter(d => !d.dataPagamento).reduce((acc, d) => acc + (d.valor ?? 0), 0));
}
