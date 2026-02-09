import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DespesasService } from '../../services/despesas.service';
import { ItensService } from '../../services/itens.service';
import { BancosService } from '../../services/bancos.service';
import { Banco } from '../../models/banco.model';
import { Item, ItemTipo } from '../../models/item.model';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-itens',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="wrap">
      <div class="header">
        <div>
          <h2>Cadastros</h2>
          <p class="sub">Itens e bancos (catálogo via API)</p>
        </div>

        <div class="tabs" role="tablist">
          <button type="button" class="tab" [class.active]="aba() === 'itens'" (click)="setAba('itens')">
            Itens
          </button>
          <button type="button" class="tab" [class.active]="aba() === 'bancos'" (click)="setAba('bancos')">
            Bancos
          </button>
        </div>
      </div>

      <!-- ITENS -->
      <ng-container *ngIf="aba() === 'itens'">
        <form class="card" [formGroup]="form" (ngSubmit)="salvar()">
        <div class="row">
          <select formControlName="tipo">
            <option value="EMPRESA">Empresa</option>
            <option value="PROFISSIONAL">Profissional</option>
            <option value="SERVICO">Serviço</option>
          </select>

          <input type="text" formControlName="nome" placeholder="Nome do item" />
          <input type="text" formControlName="atividade" placeholder="Atividade (ex.: Energia, Fisioterapia...)" />

          <button type="submit" class="btn primary" [disabled]="form.invalid">
            {{ editando ? 'Atualizar' : 'Adicionar' }}
          </button>
        </div>
        </form>



<div class="search-row">
  <input
    type="text"
    class="input"
    placeholder="Buscar banco por código, nome ou ISPB..."
    [value]="bancoBusca()"
    (input)="bancoBusca.set(($any($event.target).value || '').toString())"
  />
  <button type="button" class="btn btn-ghost" (click)="bancoBusca.set('')" [disabled]="!bancoBusca()">
    Limpar
  </button>
  <span class="muted">{{ bancosVisiveis().length }} / {{ bancos().length }}</span>
</div>
        <div class="list">
        <table>
          <thead>
            <tr>
              <th class="col-tipo">Tipo</th>
              <th class="col-nome">Nome</th>
              <th class="col-atividade">Atividade</th>
              <th class="col-status">Status</th>
              <th class="col-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of itens()">
              <td class="col-tipo">{{ item.tipo }}</td>
              <td class="col-nome">{{ item.nome }}</td>
              <td class="col-atividade">{{ item.atividade }}</td>

              <td class="col-status">
                <span class="pill" [class.off]="!item.ativo">
                  {{ item.ativo ? 'Ativo' : 'Inativo' }}
                </span>
              </td>

              <td class="col-acoes">
                <button class="btn-sm"
                        (click)="editar(item)"
                        [disabled]="!item.ativo">
                  Editar
                </button>

                <button class="btn-sm danger"
                        *ngIf="item.ativo"
                        (click)="inativar(item)">
                  Inativar
                </button>

                <button class="btn-sm"
                        *ngIf="!item.ativo"
                        (click)="ativar(item)">
                  Reativar
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty" *ngIf="!itens().length">
          Nenhum item cadastrado.
        </div>
      </div>
      </ng-container>

      <!-- BANCOS -->
      <ng-container *ngIf="aba() === 'bancos'">
        <div class="card banks">
          <div class="banks-head">
            <div>
              <h3>Bancos</h3>
              <p class="sub">Lista carregada automaticamente (1x/dia) e com inativação local.</p>
            </div>
            <div class="banks-buttons">
              <button type="button" class="btn" (click)="atualizarBancos()" [disabled]="bancosLoading()">
                {{ bancosLoading() ? 'Atualizando...' : 'Atualizar agora' }}
              </button>
              <button type="button" class="btn" (click)="ativarTodos()">
                Ativar todos
              </button>
              <button type="button" class="btn" (click)="desativarTodos()">
                Desativar todos
              </button>
            </div>
          </div>
        </div>



<div class="search-row">
  <input
    type="text"
    class="input"
    placeholder="Buscar banco por código, nome ou ISPB..."
    [value]="bancoBusca()"
    (input)="bancoBusca.set(($any($event.target).value || '').toString())"
  />
  <button type="button" class="btn btn-ghost" (click)="bancoBusca.set('')" [disabled]="!bancoBusca()">
    Limpar
  </button>
  <span class="muted">{{ bancosVisiveis().length }} / {{ bancos().length }}</span>
</div>
        <div class="list">
          <table>
            <thead>
              <tr>
                <th class="col-bank-code">Código</th>
                <th class="col-bank-name">Nome</th>
                <th class="col-status">Status</th>
                <th class="col-acoes">Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let b of bancosVisiveis()">
                <td class="col-bank-code">{{ b.code }}</td>
                <td class="col-bank-name">{{ b.name }}</td>
                <td class="col-status">
                  <span class="pill" [class.off]="isBancoInativo(b)">
                    {{ isBancoInativo(b) ? 'Inativo' : 'Ativo' }}
                  </span>
                </td>
                <td class="col-acoes">
                  <button class="btn-sm danger" *ngIf="!isBancoInativo(b)" (click)="inativarBanco(b)">Inativar</button>
                  <button class="btn-sm" *ngIf="isBancoInativo(b)" (click)="reativarBanco(b)">Reativar</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="empty" *ngIf="!bancos().length">
            Nenhum banco carregado.
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .wrap { max-width: 980px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-end; gap: 12px; margin-bottom: 12px; }
    .sub { color: #6b7280; margin: 0; }

    .tabs { display: inline-flex; gap: 8px; }
    .tab {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 8px 10px;
      border-radius: 999px;
      cursor: pointer;
    }
    .tab.active { background: #111827; color: #fff; border-color: #111827; }

    .card {
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      background: #fff;
      margin-bottom: 14px;
    }

    .row { display: grid; grid-template-columns: 180px 1fr 1fr auto; gap: 10px; }

    input, select {
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      box-sizing: border-box;
      background: #fff;
    }

    .btn {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 10px 12px;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
    }
    .btn.primary { background: #111827; color: #fff; border-color: #111827; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }

    table {
      width: 100%;
      border-collapse: collapse;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      table-layout: fixed;
    }

    th, td { padding: 10px; border-bottom: 1px solid #e5e7eb; vertical-align: middle; }
    thead th { background: #f9fafb; text-align: left; }

    .col-tipo { width: 160px; }
    .col-atividade { width: 240px; }
    .col-status { width: 120px; }
    .col-acoes { width: 220px; text-align: center; white-space: nowrap; }
    .col-nome { width: auto; }

    thead .col-acoes { text-align: center; }

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

    .pill {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 999px;
      font-size: 12px;
      border: 1px solid #e5e7eb;
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .pill.off { background: #f3f4f6; border-color: #e5e7eb; color: #6b7280; }

    .empty {
      padding: 12px;
      color: #6b7280;
      text-align: center;
      border: 1px dashed #e5e7eb;
      margin-top: 10px;
      border-radius: 10px;
    }

    .banks h3 { margin: 0 0 2px; }
    .banks-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .banks-buttons { display: flex; gap: 8px; }
    .col-bank-code { width: 120px; }
    .col-bank-name { width: auto; }

    @media (max-width: 900px) {
      .row { grid-template-columns: 1fr; }
      table { table-layout: auto; }
      .col-acoes { text-align: left; }
      thead .col-acoes { text-align: left; }
      .btn-sm { margin-left: 0; margin-right: 6px; }
      .header { flex-direction: column; align-items: stretch; }
      .tabs { justify-content: flex-start; }
      .banks-head { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class ItensComponent {
  private service = inject(ItensService);
  private despesasService = inject(DespesasService);
  private bancosService = inject(BancosService);
  private fb = inject(FormBuilder);
  private toastService = inject(ToastService);

  itens = signal<Item[]>([]);
  bancos = signal<Banco[]>([]);
  bancosLoading = signal<boolean>(false);
  bancoBusca = signal<string>('');
  aba = signal<'itens' | 'bancos'>('itens');
  editando: Item | null = null;

  form = this.fb.group({
    tipo: ['EMPRESA' as ItemTipo, Validators.required],
    nome: ['', [Validators.required, Validators.minLength(2)]],
    atividade: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    this.carregar();
    this.carregarBancos();
  }

  setAba(v: 'itens' | 'bancos'): void {
    this.aba.set(v);
  }

  carregar(): void {
    this.service.listar().subscribe(list => this.itens.set(list));
  }

  carregarBancos(): void {
    this.bancosService.listarTodos().subscribe(list => this.bancos.set(list));
  }

  atualizarBancos(): void {
    this.bancosLoading.set(true);
    this.bancosService.atualizarAgora().subscribe({
      next: (list) => {
        this.bancos.set(list);
        this.toastService.success('Lista de bancos atualizada.');
      },
      error: () => {
        this.toastService.error('Não foi possível atualizar a lista de bancos.');
      },
      complete: () => this.bancosLoading.set(false)
    });
  }



bancosVisiveis(): Banco[] {
  const q = this.bancoBusca().trim().toLowerCase();
  if (!q) return this.bancos();
  return this.bancos().filter(b => {
    const code = String(b.code ?? '');
    const name = (b.name ?? '').toLowerCase();
    const full = (b.fullName ?? '').toLowerCase();
    const ispb = String((b as any).ispb ?? '');
    return code.includes(q) || name.includes(q) || full.includes(q) || ispb.includes(q);
  });
}

  isBancoInativo(b: Banco): boolean {
    return this.bancosService.isInativo(b.code);
  }

  inativarBanco(b: Banco): void {
    this.bancosService.inativar(b.code);
    // não precisa recarregar da API; só re-renderizar status
    this.bancos.set([...this.bancos()]);
    this.toastService.success('Banco inativado localmente.');
  }

  reativarBanco(b: Banco): void {
    this.bancosService.reativar(b.code);
    this.bancos.set([...this.bancos()]);
    this.toastService.success('Banco reativado localmente.');
  }

  salvar(): void {
    const { tipo, nome, atividade } = this.form.getRawValue();
    if (!tipo || !nome || !atividade) return;

    if (this.editando) {
      this.service.atualizar({ ...this.editando, tipo, nome, atividade }).subscribe(() => {
        this.toastService.success('Item atualizado.');
        this.editando = null;
        this.form.reset({ tipo: 'EMPRESA', nome: '', atividade: '' });
        this.carregar();
      });
    } else {
      this.service.criar(tipo, nome, atividade).subscribe(() => {
        this.toastService.success('Item criado.');
        this.form.reset({ tipo: 'EMPRESA', nome: '', atividade: '' });
        this.carregar();
      });
    }
  }

  editar(item: Item): void {
    this.editando = item;
    this.form.setValue({ tipo: item.tipo, nome: item.nome, atividade: item.atividade });
  }

  inativar(item: Item): void {
    this.despesasService.existeVinculoComItem(item.id).subscribe((vinculado: boolean) => {
      if (vinculado) {
        this.toastService.error('Não é possível inativar: este item já possui despesas associadas.');
        return;
      }

      this.service.inativar(item.id).subscribe(() => {
        if (this.editando?.id === item.id) this.editando = null;
        this.toastService.success('Item inativado.');
        this.carregar();
      });
    });
  }

  ativar(item: Item): void {
    this.service.ativar(item.id).subscribe(() => {
      this.toastService.success('Item reativado.');
      this.carregar();
    });
  }

  ativarTodos(): void {
    const bancos = this.bancos();
    bancos.forEach(b => this.bancosService.reativar(b.code));
    this.bancos.set([...bancos]);
    this.toastService.success('Todos os bancos foram ativados.');
  }

  desativarTodos(): void {
    const bancos = this.bancos();
    bancos.forEach(b => this.bancosService.inativar(b.code));
    this.bancos.set([...bancos]);
    this.toastService.success('Todos os bancos foram desativados.');
  }

}
