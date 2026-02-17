import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DespesasService } from '../../services/despesas.service';
import { ItensService } from '../../services/itens.service';
import { Despesa } from '../../models/despesa.model';
import { Item, ItemTipo } from '../../models/item.model';
import { ExportService } from '../../services/export.service';
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
            <option value="TODOS">Todos os tipos</option>
            <option value="EMPRESA">Empresa</option>
            <option value="PROFISSIONAL">Profissional</option>
            <option value="SERVICO">Serviço</option>
            <option value="DESPESA">Despesa</option>
          </select>
        </div>
      </div>

      <section class="cards">
        <div class="card">
          <div class="k">Valor no mês</div>
          <div class="v">{{ totalPagasValor() | currency:'BRL' }}</div>
        </div>

        <div class="card">
          <div class="k">Total geral</div>
          <div class="v">{{ totalValor() | currency:'BRL' }}</div>
        </div>

        <div class="card paid">
          <div class="k">Pagas</div>
          <div class="v">{{ totalPagasQtd() }}</div>
          <div class="muted">{{ totalPagasValor() | currency:'BRL' }}</div>
        </div>

        <div class="card pending">
          <div class="k">Pendentes</div>
          <div class="v">{{ totalPendentesQtd() }}</div>
          <div class="muted">{{ totalPendentesValor() | currency:'BRL' }}</div>
        </div>
      </section>

      <section class="list">
        <div class="list-header">
          <h3>Listagem</h3>
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
              <tr *ngFor="let d of filtradas()">
                <td>{{ d.dataVencimento | date:'dd/MM/yyyy' }}</td>
                <td>{{ d.dataPagamento | date:'dd/MM/yyyy' }}</td>
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
          <div class="empty">
            Nenhuma despesa encontrada para os filtros selecionados.
          </div>
        </ng-template>
      </section>
    </div>
  `,
  styles: [`
    .wrap { max-width: 1100px; margin: 0 auto; }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 14px;
    }

    h2 { margin: 0; }
    .sub { margin: 2px 0 0; color: #6b7280; }

    .filters { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
    select {
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 14px;
    }

    .card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      background: #fff;
    }

    .card.paid { background: #f0fdf4; border-color: #bbf7d0; }
    .card.pending { background: #fffbeb; border-color: #fde68a; }

    .k { color: #6b7280; font-size: 12px; }
    .v { font-size: 22px; font-weight: 700; }
    .muted { color: #6b7280; font-weight: 500; font-size: 12px; }

    .list { margin-top: 8px; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }

    .table-wrap {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
    }

    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
    thead th { background: #f9fafb; text-align: left; }
    .right { text-align: right; }

    .export { display: flex; gap: 10px; justify-content: flex-end; margin-top: 10px; }

    .btn {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 10px 12px;
      border-radius: 10px;
      cursor: pointer;
    }

    .empty {
      padding: 12px;
      color: #6b7280;
      text-align: center;
      border: 1px dashed #e5e7eb;
      border-radius: 12px;
      background: #fff;
    }

    @media (max-width: 980px) {
      .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }

    @media (max-width: 640px) {
      .header { flex-direction: column; align-items: stretch; }
      .cards { grid-template-columns: 1fr; }
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

  constructor(private toast: ToastService) {
    // quando itens chegam, reprocessa filtros (evita tudo virar '—')
    this.itensService.listar().subscribe(list => {
      this.itens.set(list ?? []);
      this.applyFilters();
    });

    this.reload();
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

  // ✅ FIX UUID: itemId e item.id são string
  tipoDoItem(itemId: string): ItemTipo | '—' {
    return this.itens().find(i => i.id.toString() === String(itemId))?.tipo ?? '—';
  }

  // ✅ FIX UUID: itemId e item.id são string
  atividadeDoItem(itemId: string): string {
    return this.itens().find(i => i.id.toString() === String(itemId))?.atividade ?? '—';
  }

  exportar(formato: 'txt' | 'pdf' | 'xls' | 'xlsx'): void {
    const rows = this.filtradas().map(d => ({
      Vencimento: d.dataVencimento,
      Pagamento: d.dataPagamento ?? '',
      Tipo: this.tipoDoItem(d.itemId),
      Item: d.itemNome,
      Atividade: this.atividadeDoItem(d.itemId),
      Descricao: d.descricao,
      Banco: d.bancoPagamento,
      Valor: Number(d.valor ?? 0),
      Status: d.dataPagamento ? 'Paga' : 'Pendente'
    }));

    const payload = {
      filename: `relatorio_mensal_${this.ano}_${String(this.mes).padStart(2, '0')}`,
      rows
    };

    const exp: any = this.exportService;

    // tenta os métodos existentes no seu ExportService
    if (formato === 'txt') {
      if (typeof exp.exportTxt === 'function') return exp.exportTxt(payload);
      if (typeof exp.exportTXT === 'function') return exp.exportTXT(payload);
    }

    if (formato === 'pdf') {
      if (typeof exp.exportPdf === 'function') return exp.exportPdf(payload);
      if (typeof exp.exportPDF === 'function') return exp.exportPDF(payload);
    }

    if (formato === 'xls') {
      if (typeof exp.exportXls === 'function') return exp.exportXls(payload);
    }

    if (formato === 'xlsx') {
      if (typeof exp.exportXlsx === 'function') return exp.exportXlsx(payload);
      // alguns projetos usam exportXls mesmo pra xlsx
      if (typeof exp.exportXls === 'function') return exp.exportXls(payload);
    }

    // fallback seguro
    this.toast?.error?.('Exportação não disponível (método não encontrado no ExportService).');
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

  totalPagasValor = computed(() =>
    this.filtradas()
      .filter(d => !!d.dataPagamento)
      .reduce((acc, d) => acc + Number(d.valor ?? 0), 0)
  );

  totalPendentesValor = computed(() =>
    this.filtradas()
      .filter(d => !d.dataPagamento)
      .reduce((acc, d) => acc + Number(d.valor ?? 0), 0)
  );
}
