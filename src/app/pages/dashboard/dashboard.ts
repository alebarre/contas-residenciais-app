import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DespesasService } from '../../services/despesas.service';
import { DashboardResumo } from '../../models/dashboard.model';
import { Despesa } from '../../models/despesa.model';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';



@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
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
        </div>
      </div>
      <div class="card paid">
        <div class="k">Pagas</div>
        <div class="v">{{ pagasQtd() }}</div>
        <div class="muted">{{ pagasTotal() | currency:'BRL' }}</div>
      </div>

      <div class="card pending">
        <div class="k">Pendentes</div>
        <div class="v">{{ pendentesQtd() }}</div>
        <div class="muted">{{ pendentesTotal() | currency:'BRL' }}</div>
      </div>
    </section>

    <section class="list">

      <div class="list-header">
        <h3>Contas cadastradas no mês</h3>
        <div class="muted">{{ despesas().length }} registro(s)</div>
      </div>

      <div class="list-header">
        <div class="edit-card" *ngIf="editando() as e">
          <div class="edit-title">Editando: <b>{{ e.itemNome }}</b></div>

          <div class="edit-grid">
            <div class="field">
              <label>Vencimento</label>
              <input type="date" [(ngModel)]="e.dataVencimento" />
            </div>

            <div class="field">
              <label>Pagamento (opcional)</label>
              <input type="date" [(ngModel)]="e.dataPagamento" />
            </div>

            <div class="field">
              <label>Banco</label>
              <input type="text" [(ngModel)]="e.bancoPagamento" />
            </div>

            <div class="field">
              <label>Valor</label>
              <input type="number" step="0.01" [(ngModel)]="e.valor" />
            </div>

            <div class="field full">
              <label>Descrição</label>
              <input type="text" [(ngModel)]="e.descricao" />
            </div>
          </div>

          <div class="edit-actions">
            <button type="button" class="btn" (click)="cancelarEdicao()">Cancelar</button>
            <button type="button" class="btn primary" (click)="salvarEdicao()">Salvar</button>
          </div>

          <p class="edit-error" *ngIf="erroEdicao()">{{ erroEdicao() }}</p>

        </div>

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
            <tr *ngFor="let d of despesas()" [class.row-paid]="!!d.dataPagamento" [class.row-pending]="!d.dataPagamento">
              <td>{{ d.dataVencimento | date:'dd/MM/yyyy' }}</td>
              <td>{{ d.dataPagamento | date:'dd/MM/yyyy' }}</td>
              <td>{{ d.itemNome }}</td>
              <td>{{ d.descricao }}</td>
              <td>{{ d.bancoPagamento }}</td>
              <td class="right">{{ d.valor | currency:'BRL' }}</td>
              <td class="right">
                <button type="button" class="btn-sm" (click)="editar(d)">Editar</button>
                <button type="button" class="btn-sm danger" (click)="excluir(d)">Excluir</button>
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
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;
    }

    .card.paid { background: #f0fdf4; border-color: #bbf7d0; }     /* verde claro */
    .card.pending { background: #fffbeb; border-color: #fde68a; }  /* amarelo claro */

    .row-paid { background: #f0fdf4; }     /* verde + claro */
    .row-pending { background: #fffbeb; }  /* amarelo + claro */

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

    .edit-card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      background: #fff;
      margin: 10px 0 12px;
    }

    .edit-title { margin-bottom: 10px; color: #374151; }

    .edit-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
    }

    .edit-grid .field { display: grid; gap: 6px; }
    .edit-grid .full { grid-column: 1 / -1; }

    .edit-grid label { font-size: 12px; color: #374151; }

    .edit-grid input {
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
    }

    .edit-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 10px;
    }

    @media (max-width: 900px) {
      .edit-grid { grid-template-columns: 1fr; }
      .edit-grid .full { grid-column: auto; }
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

    .edit-error { color: #b91c1c; margin: 8px 0 0; }

    @media (max-width: 1300px) {
      .cards { grid-template-columns: repeat(3, minmax(0, 1fr)); }
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
  private confirmService = inject(ConfirmService);
  private toast = inject(ToastService);

  private now = new Date();
  ano = signal(this.now.getFullYear());
  mes = signal(this.now.getMonth() + 1); // 1..12

  resumo = signal<DashboardResumo | null>(null);
  despesas = signal<Despesa[]>([]);

  pagas = computed(() => this.despesas().filter(d => !!d.dataPagamento));
  pendentes = computed(() => this.despesas().filter(d => !d.dataPagamento));

  pagasQtd = computed(() => this.pagas().length);
  pendentesQtd = computed(() => this.pendentes().length);

  pagasTotal = computed(() => this.pagas().reduce((acc, d) => acc + (d.valor ?? 0), 0));
  pendentesTotal = computed(() => this.pendentes().reduce((acc, d) => acc + (d.valor ?? 0), 0));

  editando = signal<Despesa | null>(null);
  editandoOriginal = signal<Despesa | null>(null);
  erroEdicao = signal<string>('');

  pendenteExclusao = signal<Despesa | null>(null);
  private undoTimer: number | null = null;

  mesLabel = computed(() => {
    const m = this.mes();
    const nomes = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    return nomes[m - 1] ?? String(m);
  });

  constructor() {
    this.reload();
  }

  novaDespesa(): void {
    this.router.navigateByUrl('/app/despesas/nova');
  }

  editar(d: Despesa): void {
    this.erroEdicao.set('');
    const copia = { ...d, dataPagamento: d.dataPagamento ?? null };
    this.editandoOriginal.set({ ...copia }); // guarda original
    this.editando.set(copia);                // edição
  }

/* cancelarEdicao - descarta edição com confirmação se houver mudanças.
e não houver mudanças, descarta diretamente.
Se não houver edição em andamento, apenas limpa os sinais.
Exibe toast de informação ao descartar mudanças.
Retorna uma Promise<void> para aguardar a confirmação do usuário. */
async cancelarEdicao(): Promise<void> {
  this.erroEdicao.set('');

  const e = this.editando();
  const o = this.editandoOriginal();

  if (!e || !o) {
    this.editando.set(null);
    this.editandoOriginal.set(null);
    return;
  }

  const mudou =
    (e.dataVencimento ?? '') !== (o.dataVencimento ?? '') ||
    (e.dataPagamento ?? '') !== (o.dataPagamento ?? '') ||
    (e.bancoPagamento ?? '') !== (o.bancoPagamento ?? '') ||
    (e.descricao ?? '') !== (o.descricao ?? '') ||
    Number(e.valor ?? 0) !== Number(o.valor ?? 0);

  if (!mudou) {
    this.editando.set(null);
    this.editandoOriginal.set(null);
    return;
  }

  const ok = await this.confirmService.ask({
    title: 'Descartar alterações',
    message: 'Você fez alterações nesta despesa. Deseja descartar?',
    confirmText: 'Descartar',
    cancelText: 'Continuar editando',
    danger: true
  });

  if (!ok) return;

  this.editando.set(null);
  this.editandoOriginal.set(null);
  this.toast.info('Alterações descartadas.');
}


salvarEdicao(): void {
  const e = this.editando();
  const orig = this.editandoOriginal();
  if (!e || !orig) return;

  this.erroEdicao.set('');

  // vencimento obrigatório
  if (!e.dataVencimento || !e.dataVencimento.trim()) {
    this.erroEdicao.set('A data de vencimento é obrigatória.');
    // restaura o vencimento original
    e.dataVencimento = orig.dataVencimento;
    this.editando.set({ ...e });
    this.toast.error('Informe a data de vencimento para salvar.');
    return;
  }

  const atualizado: Despesa = {
    ...e,
    dataPagamento: e.dataPagamento ? e.dataPagamento : null
  };

  this.despesasService.atualizar(atualizado).subscribe(() => {
    this.editando.set(null);
    this.editandoOriginal.set(null);
    this.toast.success('Despesa atualizada.');
    this.reload();
  });
}



async excluir(d: Despesa): Promise<void> {
  const ok = await this.confirmService.ask({
    title: 'Excluir despesa',
    message: `Deseja excluir "${d.itemNome}" (venc. ${d.dataVencimento})?`,
    confirmText: 'Excluir',
    cancelText: 'Cancelar',
    danger: true
  });

  if (!ok) return;

  // se já havia algo pendente, efetiva antes (evita empilhar undos)
  const pendente = this.pendenteExclusao();
  if (pendente) {
    this.efetivarExclusao(pendente.id);
    this.limparUndo();
  }

  // remove da lista da UI imediatamente
  this.despesas.set(this.despesas().filter(x => x.id !== d.id));

  // fecha editor se estava editando a mesma despesa
  if (this.editando()?.id === d.id) this.editando.set(null);

  // guarda como pendente
  this.pendenteExclusao.set(d);

  // toast com ação desfazer
  this.toast.show({
    type: 'info',
    title: 'Despesa removida',
    message: 'Você pode desfazer esta exclusão por alguns segundos.',
    timeoutMs: 5000,
    action: {
      label: 'Desfazer',
      onClick: () => this.desfazerExclusao()
    }
  });

  // timer para efetivar
  this.undoTimer = window.setTimeout(() => {
    const p = this.pendenteExclusao();
    if (!p) return;
    this.efetivarExclusao(p.id);
    this.limparUndo();
  }, 5000);
}

  reload(): void {
    const ano = this.ano();
    const mes = this.mes();

    this.despesasService.listarPorMes(ano, mes).subscribe(list => this.despesas.set(list));

    this.dashboardService.getResumo(ano, mes).subscribe(r => {
      this.dashboardService.getHistoricoAnual(ano).subscribe(hist => {
        this.resumo.set({ ...r, historicoMensal: hist });
      });
    });
  }

  /**
   * Faz parte do "APAGAR TEMPORÁRIO"
   * Ao excluir uma despesa:
   * ela sai da lista imediatamente
   * aparece um toast com “Desfazer” por ~5s
   * se clicar “Desfazer”, a despesa volta
   * se não desfizer, a exclusão é persistida
   * **/
  private limparUndo(): void {
    if (this.undoTimer) {
      window.clearTimeout(this.undoTimer);
      this.undoTimer = null;
    }
    this.pendenteExclusao.set(null);
  }

  private efetivarExclusao(id: number): void {
    this.despesasService.excluir(id).subscribe(() => {
      this.toast.success('Despesa excluída.');
      this.reload();
    });
  }

  desfazerExclusao(): void {
    const d = this.pendenteExclusao();
    if (!d) return;

    // volta na lista atual em memória (UI)
    this.despesas.set([d, ...this.despesas()]);
    this.toast.info('Exclusão desfeita.');
    this.limparUndo();
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
