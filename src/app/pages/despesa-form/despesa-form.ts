import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ItensService } from '../../services/itens.service';
import { BancosService } from '../../services/bancos.service';
import { Item, ItemTipo } from '../../models/item.model';
import { DespesasService } from '../../services/despesas.service';
import { ToastService } from '../../services/toast.service';
import { Banco } from '../../models/banco.model';

@Component({
  selector: 'app-despesa-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="wrap">
      <div class="header">
        <div>
          <h2>Nova despesa</h2>
          <p class="sub">Cadastro de conta mensal</p>
        </div>

        <button type="button" class="btn" (click)="cancelar()">Voltar</button>
      </div>

      <form class="card" [formGroup]="form" (ngSubmit)="salvar()">
        <div class="grid">
          <div class="field">
            <label>Tipo</label>
            <select formControlName="tipo">
              <option value="EMPRESA">Empresa</option>
              <option value="PROFISSIONAL">Profissional</option>
              <option value="SERVICO">Serviço</option>
            </select>
          </div>

          <div class="field">
            <label>Item</label>
            <select formControlName="itemId">
              <option *ngFor="let it of itensFiltrados()" [value]="it.id">{{ it.nome }}</option>
            </select>
            <small class="hint" *ngIf="form.controls.itemId.touched && form.controls.itemId.invalid">
              Selecione um item.
            </small>
          </div>

          <div class="field">
            <label>Data do vencimento</label>
            <input type="date" formControlName="dataVencimento" />
          </div>

          <div class="field">
            <label>Data do pagamento</label>
            <input type="date" formControlName="dataPagamento" />
          </div>

          <div class="field">
            <label>Banco de pagamento</label>
            <select formControlName="bancoCode">
              <option value="">(Sem banco)</option>
              <option *ngFor="let b of bancosAtivos()" [value]="b.code">{{ b.name }}</option>
            </select>
          </div>

          <div class="field">
            <label>Valor (R$)</label>
            <input type="number" step="0.01" formControlName="valor" />
          </div>

          <div class="field full">
            <label>Descrição</label>
            <input type="text" formControlName="descricao" placeholder="Ex.: Conta de energia - Janeiro" />
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn ghost" (click)="cancelar()">Cancelar</button>
          <button type="submit" class="btn primary" [disabled]="form.invalid || loading">
            {{ loading ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>

        <p class="success" *ngIf="success">{{ success }}</p>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>
    </div>
  `,
  styles: [`
    .wrap { max-width: 980px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 12px; }
    h2 { margin: 0; }
    .sub { margin: 2px 0 0; color: #6b7280; }

    .card { border: 1px solid #e5e7eb; border-radius: 12px; padding: 12px; background: #fff; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }

    .field { display: grid; gap: 6px; }
    .full { grid-column: 1 / -1; }

    label { font-size: 12px; color: #374151; }
    input, select {
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      background: #fff;
      box-sizing: border-box;
    }

    .hint { color: #6b7280; }
    .actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 12px; }

    .btn { border: 1px solid #e5e7eb; background: #fff; padding: 10px 12px; border-radius: 10px; cursor: pointer; }
    .btn.primary { background: #111827; color: #fff; border-color: #111827; }
    .btn.ghost { background: #fff; }
    .btn:disabled { opacity: .6; cursor: not-allowed; }

    .success { color: #065f46; margin: 10px 0 0; }
    .error { color: #b91c1c; margin: 10px 0 0; }

    @media (max-width: 900px) {
      .grid { grid-template-columns: 1fr; }
      .full { grid-column: auto; }
      .header { flex-direction: column; align-items: stretch; }
    }
  `]
})
export class DespesaFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private itensService = inject(ItensService);
  private bancosService = inject(BancosService);
  private despesasService = inject(DespesasService);
  private toast = inject(ToastService);

  loading = false;
  success = '';
  error = '';

  itens = signal<Item[]>([]);
  bancosAtivos = signal<Banco[]>([]);
  tipoSig = signal<ItemTipo>('EMPRESA');

  form = this.fb.group({
    tipo: ['EMPRESA' as ItemTipo, [Validators.required]],
    itemId: ['', [Validators.required]],
    dataVencimento: ['', [Validators.required]],
    dataPagamento: ['', ],
    descricao: ['', [Validators.required, Validators.minLength(3)]],
    bancoCode: [''],
    valor: [null as number | null, [Validators.required, Validators.min(0.01)]],
  });

  itensFiltrados = computed(() => {
    const tipo = this.tipoSig();
    return this.itens().filter(i => i.ativo && i.tipo === tipo);
  });

  constructor() {
  // valor inicial do form -> signal
  this.tipoSig.set(this.form.controls.tipo.value as ItemTipo);

  this.itensService.listar().subscribe(list => {
    this.itens.set(list);
    this.syncItemSelection();
  });

  // bancos (catálogo via API + inativação local)
  this.bancosService.listarAtivos().subscribe(list => {
    this.bancosAtivos.set(list);
  });

  this.form.controls.tipo.valueChanges.subscribe(v => {
    this.tipoSig.set(v as ItemTipo);     // Faz computed recalcular
    this.syncItemSelection();            // limpa itemId se não for do tipo
  });
}

  private syncItemSelection(): void {
    const current = this.form.controls.itemId.value;
    if (current && !this.itensFiltrados().some(i => String(i.id) === String(current))) {
      this.form.controls.itemId.setValue('');
    }
  }

  cancelar(): void {
    this.router.navigateByUrl('/app/dashboard');
  }

  salvar(): void {
  this.success = '';
  this.error = '';
  if (this.form.invalid) {
    this.toast.error('Revise os campos obrigatórios antes de salvar.');
    this.form.markAllAsTouched();
    return;
  }


  const v = this.form.getRawValue();

  const bancoCode = v.bancoCode ? Number(v.bancoCode) : null;
  const bancoNome = bancoCode
    ? (this.bancosAtivos().find(b => b.code === bancoCode)?.name ?? '')
    : '';

  this.loading = true;

  this.despesasService.criar({
    itemId: v.itemId!,
    itemNome: this.itens().find(i => i.id === Number(v.itemId))?.nome ?? '',
    dataVencimento: v.dataVencimento!,
    dataPagamento: v.dataPagamento ? v.dataPagamento : null,
    descricao: v.descricao!,
    bancoPagamento: bancoNome,
    bancoCode,
    valor: Number(v.valor),
  }).subscribe(() => {
    this.toast.success('Despesa cadastrada.');
    this.router.navigateByUrl('/app/dashboard');
  });

  }

}
