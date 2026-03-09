import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from '../../services/dashboard.service';
import { DespesasService } from '../../services/despesas.service';
import { ItensService } from '../../services/itens.service';
import { DashboardResumo } from '../../models/dashboard.model';
import { Despesa } from '../../models/despesa.model';
import { Item } from '../../models/item.model';
import { Banco } from '../../models/banco.model';
import { FormsModule } from '@angular/forms';
import { ConfirmService } from '../../services/confirm.service';
import { ToastService } from '../../services/toast.service';
import { BancosService } from '../../services/bancos.service';
import { PAYMENT_METHOD_LABEL } from '../../models/despesa.model';

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
        <div class="k">Contas nesse mês</div>
        <div class="v_ContasMes">{{ r.contasDoMes }}</div>
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
        <div class="muted">{{ despesasVisiveis().length }} registro(s)</div>
      </div>

      <div class="search-row">
        <input
          type="text"
          class="search-input"
          placeholder="Buscar por item, banco, descrição..."
          [value]="despesasBusca()"
          (input)="despesasBusca.set(($any($event.target).value || '').toString())"
        />
        <button
          type="button"
          class="btn btn-ghost"
          (click)="despesasBusca.set('')"
          [disabled]="!despesasBusca()"
        >
          Limpar
        </button>
        <span *ngIf="despesasBusca()" class="muted">{{ despesasVisiveis().length }} / {{ despesas().length }}</span>
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
              <label>Banco de pagamento</label>
              <select [(ngModel)]="e.bancoCode" (ngModelChange)="onBancoEditChange($event)">
                <option [ngValue]="null">(Sem banco)</option>
                <option *ngFor="let b of bancosSelect()" [ngValue]="b.code">{{ bancoLabel(b) }}</option>
              </select>
              <small class="hint" *ngIf="e.bancoCode && isBancoInativoCode(e.bancoCode)">
                Banco inativo (despesa antiga preservada).
              </small>
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

      <div class="table-wrap" *ngIf="despesasVisiveis().length; else empty">
        <table>
          <thead>
            <tr>
              <th class="col-item">Item</th>
              <th class="col-venc">Vencimento</th>
              <th class="col-pag">Pagamento</th>
              <th class="col-bank">Banco</th>
              <th class="col-method">Forma</th>
              <th class="col-val right">Valor</th>
              <th class="col-desc">Descrição</th>
              <th class="col-actions">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let d of despesasVisiveis()" [class.row-paid]="!!d.dataPagamento" [class.row-pending]="!d.dataPagamento">
              <td class="col-item col-item-estilo">
                <div>{{ d.itemNome }}</div>
                <div class="item-atividade" *ngIf="getAtividadeDoItem(d.itemId)">{{ getAtividadeDoItem(d.itemId) }}</div>
              </td>
              <td class="col-venc">{{ d.dataVencimento | date:'dd/MM/yyyy' }}</td>
              <td class="col-pag">{{ d.dataPagamento | date:'dd/MM/yyyy' }}</td>
              <td class="col-bank">{{ d.bancoPagamento }}</td>
              <td class="col-method">{{ paymentLabel[d.paymentMethod] }}</td>
              <td class="col-val">{{ d.valor | currency:'BRL' }}</td>
              <td class="col-desc">{{ d.descricao }}</td>
              <td class="col-actions ">
                <button type="button" class="btn-sm" (click)="editar(d)">Editar</button>
                <button type="button" class="btn-sm danger" (click)="excluir(d)">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <ng-template #empty>
        <div class="empty">
          <ng-container *ngIf="despesasBusca(); else semRegistros">
            Nenhuma despesa encontrada para "{{ despesasBusca() }}".
          </ng-container>
          <ng-template #semRegistros>
            Nenhuma despesa cadastrada em {{ mesLabel() }}/{{ ano() }}.
          </ng-template>
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
    }
    .k { color: #6b7280; font-size: 16px; font-weight: 900;}
    .v_ContasMes { font-size: 42px; font-weight: 700; }
    .v { font-size: 22px; font-weight: 700; }
    .v.small { font-size: 14px; font-weight: 600; }
    .muted { color: #6b7280; font-weight: 500; font-size: 12px; }

    .bars { display: flex; gap: 6px; align-items: flex-end; height: 40px; }
    .bar {
      width: 10px;
      border-radius: 6px;
      background: #111827;
      opacity: .25;
    }

    .list { margin-top: 12px; }
    .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }

    .search-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }
    .search-input {
      flex: 1;
      padding: 8px 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
      box-sizing: border-box;
    }
    .btn-ghost {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 8px 10px;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

    .table-wrap {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; overflow: hidden; text-overflow: ellipsis; }
    thead th { background: #f9fafb; text-align: left; }
    .right { text-align: right; }

    /* Larguras das colunas */
    .col-item { width: 17%; }
    .col-venc { width: 8%; }
    .col-pag { width: 8%; }
    .col-desc { width: 15%; }
    .col-bank { width: 11%; }
    .col-method { width: 8%; }
    .col-val { width: 12%; }
    .col-actions { width: 21%; }

    .col-item-estilo {
      font-weight: bolder;
      font-size: 15px;
      color: #111827;

    }

    .item-atividade {
      font-size: 12px;
      color: #9ca3af;
      margin-top: 4px;
      font-weight: normal;
    }

    .btn-sm {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 6px 8px;
      border-radius: 10px;
      cursor: pointer;
      margin-left: 6px;
      white-space: nowrap;
    }

    .btn-sm.danger { border-color: #fecaca; }

    .empty {
      padding: 12px;
      color: #6b7280;
      text-align: center;
      border: 1px dashed #e5e7eb;
      border-radius: 12px;
      background: #fff;
    }

    .edit-card {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      background: #fff;
      margin-top: 6px;
    }

    .edit-title { margin-bottom: 10px; }

  /* ===== Editor de despesa: responsivo ===== */

  .edit-grid {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  /* “Descrição” já ocupa a linha toda */
  .field.full {
    grid-column: 1 / -1;
  }

  /* Tablet: 2 colunas */
  @media (max-width: 980px) {
    .edit-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    /* Valor embaixo do banco (melhor leitura) */
    .field {
      min-width: 0;
    }
  }

  /* Mobile: 1 coluna */
  @media (max-width: 640px) {
    .edit-grid {
      grid-template-columns: 1fr;
    }

    .edit-actions {
      flex-direction: column;
      align-items: stretch;
    }

    .edit-actions .btn {
      width: 100%;
    }
  }
  /* Mobile (<= 640px): manter só Vencimento, Item, Valor, Ações */
  @media (max-width: 640px) {
    .col-pag,
    .col-desc,
    .col-bank {
      display: none;
    }

    /* reduz padding para caber melhor */
    th, td {
      padding: 8px;
    }

    /* ações em coluna para não esmagar */
    .col-actions .btn-sm {
      display: block;
      width: 100%;
      margin: 4px 0 0;
    }

    .col-actions .btn-sm:first-child {
      margin-top: 0;
    }
  }

  /* Tablet (641px–980px): esconde Descrição e Banco, mantém Pagamento */
  @media (min-width: 641px) and (max-width: 980px) {
    .col-desc,
    .col-bank {
      display: none;
    }
  }

    .field { display: grid; gap: 6px; }
    .field.full { grid-column: 1 / -1; }

    label { font-size: 12px; color: #374151; }

    input, select {
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
      box-sizing: border-box;
    }

    .hint { color: #6b7280; font-size: 12px; }

    .edit-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }
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
    @media (max-width: 640px) {
    .col-method { display: none; }
    }
    @media (min-width: 641px) and (max-width: 980px) {
      .col-method { display: none; } /* opcional: esconda em tablet também */
    }
  `]
})
export class DashboardComponent {
  private router = inject(Router);
  private dashboardService = inject(DashboardService);
  private despesasService = inject(DespesasService);
  private itensService = inject(ItensService);
  private bancosService = inject(BancosService);
  private confirmService = inject(ConfirmService);
  private toast = inject(ToastService);

  private now = new Date();
  ano = signal(this.now.getFullYear());
  mes = signal(this.now.getMonth() + 1); // 1..12

  resumo = signal<DashboardResumo | null>(null);
  despesas = signal<Despesa[]>([]);
  itens = signal<Item[]>([]);

  bancosAll = signal<Banco[]>([]);
  bancosAtivos = signal<Banco[]>([]);

  paymentLabel = PAYMENT_METHOD_LABEL;

  bancosSelect = computed(() => {
    const ativos = this.bancosAtivos();
    const e = this.editando();
    const code = e?.bancoCode ?? null;
    if (code != null && !ativos.some(b => b.code === code)) {
      const found = this.bancosAll().find(b => b.code === code);
      if (found) return [found, ...ativos];
    }
    return ativos;
  });

  pagas = computed(() => this.despesas().filter(d => !!d.dataPagamento));
  pendentes = computed(() => this.despesas().filter(d => !d.dataPagamento));

  pagasQtd = computed(() => this.pagas().length);
  pendentesQtd = computed(() => this.pendentes().length);

  pagasTotal = computed(() => this.pagas().reduce((acc, d) => acc + (d.valor ?? 0), 0));
  pendentesTotal = computed(() => this.pendentes().reduce((acc, d) => acc + (d.valor ?? 0), 0));

  despesasBusca = signal<string>('');

  despesasVisiveis = computed(() => {
    const q = this.despesasBusca().trim().toLowerCase();
    if (!q) return this.despesas();
    return this.despesas().filter(d => {
      const item = (d.itemNome ?? '').toLowerCase();
      const banco = (d.bancoPagamento ?? '').toLowerCase();
      const desc = (d.descricao ?? '').toLowerCase();
      const venc = (d.dataVencimento ?? '').toLowerCase();
      return item.includes(q) || banco.includes(q) || desc.includes(q) || venc.includes(q);
    });
  });

  editando = signal<Despesa | null>(null);
  editandoOriginal = signal<Despesa | null>(null);
  erroEdicao = signal<string>('');

  pendenteExclusao = signal<Despesa | null>(null);
  private undoTimer: number | null = null;

  mesLabel = computed(() => {
    const m = this.mes();
    const nomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return nomes[m - 1] ?? String(m);
  });

  constructor() {
    this.reload();

    // itens
    this.itensService.listar().subscribe(list => this.itens.set(list ?? []));

    // bancos (catálogo via API + overrides locais)
    this.bancosService.listarTodos().subscribe(list => {
      this.bancosAll.set(list);
      this.syncBancoNomeFromCode();
    });
    this.bancosService.listarAtivos().subscribe(list => this.bancosAtivos.set(list));
  }

  getAtividadeDoItem(itemId: string): string {
    return this.itens().find(i => i.id.toString() === String(itemId))?.atividade ?? '';
  }

  novaDespesa(): void {
    this.router.navigateByUrl('/app/despesas/nova');
  }

  editar(d: Despesa): void {
    this.erroEdicao.set('');
    const copia = { ...d, dataPagamento: d.dataPagamento ?? null };
    this.editandoOriginal.set({ ...copia }); // guarda original
    this.editando.set(copia);                // edição

    this.syncBancoNomeFromCode();
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
      this.efetivarExclusao(pendente.id as string);
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
      this.efetivarExclusao(p.id as string);
      this.limparUndo();
    }, 5000);
  }

  reload(): void {
    const ano = this.ano();
    const mes = this.mes();

    //1 chamada única: summary (inclui historicoMensal) + expenses do mês
    this.dashboardService.getDashboard(ano, mes).subscribe((payload) => {
      this.despesas.set(payload.expenses ?? []);
      this.resumo.set(payload.summary);
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

  private efetivarExclusao(id: string): void {
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

  // ----- bancos (edição no dashboard) -----

  bancoLabel(b: Banco): string {
    const name = b.name ?? '';
    return this.bancosService.isInativo(b.code) ? `${name} (inativo)` : name;
  }

  isBancoInativoCode(code: number | null | undefined): boolean {
    if (code == null) return false;
    return this.bancosService.isInativo(code);
  }

  onBancoEditChange(code: number | null): void {
    const e = this.editando();
    if (!e) return;

    e.bancoCode = code;

    if (code == null) {
      e.bancoPagamento = '';
    } else {
      const name = this.bancosAll().find(b => b.code === code)?.name ?? '';
      e.bancoPagamento = name;
    }

    // força re-render
    this.editando.set({ ...e });
  }

  private syncBancoNomeFromCode(): void {
    const e = this.editando();
    if (!e) return;

    const code = e.bancoCode ?? null;
    if (code == null) {
      if (e.bancoPagamento) {
        e.bancoPagamento = '';
        this.editando.set({ ...e });
      }
      return;
    }

    const name = this.bancosAll().find(b => b.code === code)?.name ?? '';
    if (name && e.bancoPagamento !== name) {
      e.bancoPagamento = name;
      this.editando.set({ ...e });
    }
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
