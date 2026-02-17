import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { DespesasService } from '../../services/despesas.service';
import { ItensService } from '../../services/itens.service';
import { Despesa } from '../../models/despesa.model';
import { Item, ItemTipo } from '../../models/item.model';
import { ExportService, ExportTable } from '../../services/export.service';


type TipoFiltro = 'TODOS' | ItemTipo;

interface MesResumo {
  mes: number; // 1..12
  totalQtd: number;
  totalValor: number;
  pagasQtd: number;
  pagasValor: number;
  pendentesQtd: number;
  pendentesValor: number;
}

@Component({
  selector: 'app-relatorio-anual',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <div class="header">
        <div>
          <h2>Relatório Anual</h2>
          <p class="sub">Resumo consolidado por mês</p>
        </div>

        <div class="filters">
          <select [(ngModel)]="ano" (ngModelChange)="reload()">
            <option *ngFor="let a of anosDisponiveis()" [value]="a">{{ a }}</option>
          </select>

          <select [(ngModel)]="tipo" (ngModelChange)="reload()">
            <option value="TODOS">Todos os tipos</option>
            <option value="EMPRESA">Empresa</option>
            <option value="PROFISSIONAL">Profissional</option>
            <option value="SERVICO">Serviço</option>
          </select>
        </div>
      </div>

      <section class="kpis" *ngIf="!loading(); else loadingTpl">
        <div class="kpi">
          <div class="k">Total (ano)</div>
          <div class="v">{{ totalAnualQtd() }}</div>
          <div class="muted">{{ totalAnualValor() | currency:'BRL' }}</div>
        </div>

        <div class="kpi paid">
          <div class="k">Pagas</div>
          <div class="v">{{ pagasAnualQtd() }}</div>
          <div class="muted">{{ pagasAnualValor() | currency:'BRL' }}</div>
        </div>

        <div class="kpi pending">
          <div class="k">Pendentes</div>
          <div class="v">{{ pendentesAnualQtd() }}</div>
          <div class="muted">{{ pendentesAnualValor() | currency:'BRL' }}</div>
        </div>
      </section>

      <ng-template #loadingTpl>
        <div class="loading">
          Carregando resumo anual...
        </div>
      </ng-template>

      <section class="list" *ngIf="!loading()">
        <div class="list-header">
          <h3>Resumo por mês</h3>
          <div class="muted">Ano {{ ano }}</div>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Mês</th>
                <th class="right">Total (Qtd)</th>
                <th class="right">Total (R$)</th>
                <th class="right">Pagas (Qtd)</th>
                <th class="right">Pagas (R$)</th>
                <th class="right">Pendentes (Qtd)</th>
                <th class="right">Pendentes (R$)</th>
                <th>Visual</th>
              </tr>
            </thead>

            <tbody>
              <tr *ngFor="let r of resumoPorMes()">
                <td>{{ mesLabel(r.mes) }}</td>
                <td class="right">{{ r.totalQtd }}</td>
                <td class="right">{{ r.totalValor | currency:'BRL' }}</td>
                <td class="right">
                  <span class="pill paid">{{ r.pagasQtd }}</span>
                </td>
                <td class="right">{{ r.pagasValor | currency:'BRL' }}</td>
                <td class="right">
                  <span class="pill pending">{{ r.pendentesQtd }}</span>
                </td>
                <td class="right">{{ r.pendentesValor | currency:'BRL' }}</td>
                <td>
                  <div class="bars" [title]="r.totalValor | currency:'BRL'">
                    <div class="bar" [style.height.%]="barHeight(r.totalValor)"></div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div class="export">
            <button type="button" class="btn" (click)="exportar('txt')">TXT</button>
            <button type="button" class="btn" (click)="exportar('pdf')">PDF</button>
            <button type="button" class="btn" (click)="exportar('xls')">XLS</button>
          </div>
          <div class="export">
            <button type="button" class="btn" (click)="exportarDetalhado('txt')">TXT Detalhado</button>
            <button type="button" class="btn" (click)="exportarDetalhado('pdf')">PDF Detalhado</button>
            <button type="button" class="btn" (click)="exportarDetalhado('xls')">XLS Detalhado</button>
          </div>

        </div>

        <div class="note muted">
          Status é definido por <b>dataPagamento</b>: preenchida = paga, vazia = pendente.
        </div>
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
      min-width: 180px;
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

    .loading {
      padding: 14px;
      border: 1px dashed #e5e7eb;
      border-radius: 12px;
      background: #fafafa;
      color: #6b7280;
      margin-bottom: 14px;
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
    table { width: 100%; border-collapse: collapse; min-width: 980px; }
    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: middle; }
    thead th { background: #f9fafb; font-size: 12px; color: #374151; }
    .right { text-align: right; }

    .pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 12px;
      border: 1px solid #e5e7eb;
      background: #fff;
      min-width: 34px;
      text-align: center;
    }
    .pill.paid { background: #f0fdf4; border-color: #bbf7d0; }
    .pill.pending { background: #fffbeb; border-color: #fde68a; }

    .bars {
      height: 42px;
      display: flex;
      align-items: flex-end;
      width: 40px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fafafa;
      overflow: hidden;
      padding: 4px;
      box-sizing: border-box;
    }
    .bar {
      width: 100%;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
      background: #fff;
      min-height: 4px;
    }

    .note { margin-top: 10px; }

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
export class RelatorioAnualComponent {
  private despesasService = inject(DespesasService);
  private itensService = inject(ItensService);
  private exportService = inject(ExportService);

  private now = new Date();
  ano = this.now.getFullYear();
  tipo: TipoFiltro = 'TODOS';

  itens = signal<Item[]>([]);
  resumoPorMes = signal<MesResumo[]>([]);
  loading = signal<boolean>(false);

  anosDisponiveis = computed(() => {
    const y = this.now.getFullYear();
    return [y - 1, y, y + 1];
  });

  constructor() {
    this.itensService.listar().subscribe(list => this.itens.set(list));
    this.reload();
  }

  reload(): void {
    this.loading.set(true);

    const calls = Array.from({ length: 12 }).map((_, i) =>
      this.despesasService.listarPorMes(this.ano, i + 1)
    );

    forkJoin(calls).subscribe((meses: Despesa[][]) => {
      const rows: MesResumo[] = meses.map((list, idx) => {
        const mes = idx + 1;

        // filtro por tipo (opcional)
        const filtrada = this.tipo === 'TODOS'
          ? list
          : list.filter(d => {
              const tipo = this.tipoDoItem(Number(d.itemId));
              return tipo !== '—' && tipo === this.tipo;
            });

        const pagas = filtrada.filter(d => !!d.dataPagamento);
        const pendentes = filtrada.filter(d => !d.dataPagamento);

        const sum = (arr: Despesa[]) => arr.reduce((acc, d) => acc + (d.valor ?? 0), 0);

        return {
          mes,
          totalQtd: filtrada.length,
          totalValor: sum(filtrada),
          pagasQtd: pagas.length,
          pagasValor: sum(pagas),
          pendentesQtd: pendentes.length,
          pendentesValor: sum(pendentes),
        };
      });

      this.resumoPorMes.set(rows);
      this.loading.set(false);
    });
  }

  tipoDoItem(itemId: number): ItemTipo | '—' {
    return this.itens().find(i => i.id === itemId)?.tipo ?? '—';
  }

  mesLabel(m: number): string {
    const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return nomes[m - 1] ?? String(m);
  }

  exportar(formato: 'txt' | 'pdf' | 'xls'): void {
    const rows = this.resumoPorMes();

    const table: ExportTable = {
      title: 'Relatório Anual',
      subtitle: `Ano: ${this.ano} | Tipo: ${this.tipo}`,
      columns: ['Mês', 'Total Qtd', 'Total (R$)', 'Pagas Qtd', 'Pagas (R$)', 'Pendentes Qtd', 'Pendentes (R$)'],
      rows: rows.map(r => ([
        this.mesLabel(r.mes),
        r.totalQtd,
        Number(r.totalValor ?? 0).toFixed(2),
        r.pagasQtd,
        Number(r.pagasValor ?? 0).toFixed(2),
        r.pendentesQtd,
        Number(r.pendentesValor ?? 0).toFixed(2),
      ])),
      fileBaseName: `relatorio_anual_${this.ano}`
    };

    if (formato === 'txt') this.exportService.exportTxt(table);
    if (formato === 'pdf') this.exportService.exportPdf(table);
    if (formato === 'xls') this.exportService.exportXls(table);
  }

  private listarAno(): Promise<Despesa[]> {
    const calls = Array.from({ length: 12 }).map((_, i) =>
      new Promise<Despesa[]>((resolve) => {
        this.despesasService.listarPorMes(this.ano, i + 1).subscribe(list => resolve(list));
      })
    );

    return Promise.all(calls).then(all => all.flat());
  }

  async exportarDetalhado(formato: 'txt' | 'pdf' | 'xls'): Promise<void> {
    const all = await this.listarAno();

    const filtrada = this.tipo === 'TODOS'
      ? all
      : all.filter(d => this.tipoDoItem(Number(d.itemId)) === this.tipo);

    // ordena por vencimento
    filtrada.sort((a, b) => (a.dataVencimento || '').localeCompare(b.dataVencimento || ''));

    const table = {
      title: 'Relatório Anual Detalhado',
      subtitle: `Ano: ${this.ano} | Tipo: ${this.tipo}`,
      columns: ['Vencimento', 'Pagamento', 'Tipo', 'Item', 'Atividade', 'Descrição', 'Banco', 'Valor (R$)', 'Status'],
      rows: filtrada.map(d => ([
        d.dataVencimento,
        d.dataPagamento || '',
        this.tipoDoItem(Number(d.itemId)),
        d.itemNome,
        this.itens().find(i => i.id === Number(d.itemId))?.atividade ?? '—',
        d.descricao,
        d.bancoPagamento,
        Number(d.valor ?? 0).toFixed(2),
        d.dataPagamento ? 'Paga' : 'Pendente'
      ])),
      fileBaseName: `relatorio_anual_detalhado_${this.ano}`
    };

    if (formato === 'txt') this.exportService.exportTxt(table);
    if (formato === 'pdf') this.exportService.exportPdf(table);
    if (formato === 'xls') this.exportService.exportXls(table);
  }

  totalAnualQtd = computed(() => this.resumoPorMes().reduce((acc, r) => acc + r.totalQtd, 0));
  totalAnualValor = computed(() => this.resumoPorMes().reduce((acc, r) => acc + r.totalValor, 0));

  pagasAnualQtd = computed(() => this.resumoPorMes().reduce((acc, r) => acc + r.pagasQtd, 0));
  pagasAnualValor = computed(() => this.resumoPorMes().reduce((acc, r) => acc + r.pagasValor, 0));

  pendentesAnualQtd = computed(() => this.resumoPorMes().reduce((acc, r) => acc + r.pendentesQtd, 0));
  pendentesAnualValor = computed(() => this.resumoPorMes().reduce((acc, r) => acc + r.pendentesValor, 0));

  barHeight(valor: number): number {
    const max = Math.max(...this.resumoPorMes().map(r => r.totalValor), 0);
    if (max <= 0) return 5;
    return Math.max(5, Math.round((valor / max) * 100));
  }
}
