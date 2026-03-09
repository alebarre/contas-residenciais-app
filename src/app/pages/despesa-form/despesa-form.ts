import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

import { DespesasService } from '../../services/despesas.service';
import { ItensService } from '../../services/itens.service';
import { BancosService } from '../../services/bancos.service';
import { ToastService } from '../../services/toast.service';

import { Item } from '../../models/item.model';
import { Banco } from '../../models/banco.model';
import { PaymentMethod, PAYMENT_METHOD_LABEL, Despesa } from '../../models/despesa.model';

@Component({
  selector: 'app-despesa-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="wrap">
      <div class="head">
        <div>
          <h2>{{ isEdit() ? 'Editar despesa' : 'Nova despesa' }}</h2>
          <p class="sub">Informe os dados da despesa</p>
        </div>
        <button type="button" class="btn" (click)="voltar()">Voltar</button>
      </div>

      <form class="card" [formGroup]="form" (ngSubmit)="salvar()">
        <div class="grid">
          <div class="field">
            <label>Item</label>
            <select formControlName="itemId">
              <option value="" disabled>Selecione...</option>
              <option *ngFor="let i of itens()" [value]="i.id">{{ i.nome }}</option>
            </select>
          </div>

          <div class="field">
            <label>Vencimento</label>
            <input type="date" formControlName="dataVencimento" />
          </div>

          <div class="field">
            <label>Pagamento (opcional)</label>
            <input type="date" formControlName="dataPagamento" />
          </div>

          <div class="field">
            <label>Banco (opcional)</label>
            <select formControlName="bancoCode">
              <option [ngValue]="null">(Sem banco)</option>
              <option *ngFor="let b of bancosAtivos()" [ngValue]="b.code">{{ b.name }}</option>
            </select>
          </div>

          <div class="field">
            <label>Forma de pagamento</label>
            <select formControlName="paymentMethod">
              <option *ngFor="let pm of paymentMethods" [value]="pm">{{ label(pm) }}</option>
            </select>
          </div>

          <div class="field">
            <label>Valor</label>
            <input type="number" step="0.01" formControlName="valor" />
          </div>

          <div class="field full">
            <label>Descrição <span style="color:#9ca3af">(opcional)</span></label>
            <input type="text" formControlName="descricao" />
          </div>
        </div>

        <div class="actions">
          <button type="button" class="btn" (click)="voltar()">Cancelar</button>
          <button type="submit" class="btn primary" [disabled]="form.invalid || saving()">
            {{ saving() ? 'Salvando...' : 'Salvar' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .wrap { max-width: 980px; margin: 0 auto; }
    .head { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; margin-bottom:12px; }
    .sub { margin: 2px 0 0; color:#6b7280; }
    .card { border:1px solid #e5e7eb; border-radius:12px; background:#fff; padding:12px; }
    .grid { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:10px; }
    .field { display:grid; gap:6px; }
    .field.full { grid-column: 1 / -1; }
    label { font-size:12px; color:#374151; }
    input, select { padding:10px; border:1px solid #e5e7eb; border-radius:10px; width:100%; box-sizing:border-box; }
    .actions { display:flex; justify-content:flex-end; gap:10px; margin-top:12px; }
    .btn { border:1px solid #e5e7eb; background:#fff; padding:10px 12px; border-radius:10px; cursor:pointer; }
    .btn.primary { background:#111827; color:#fff; border-color:#111827; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr; } .actions { flex-direction: column; } .btn { width:100%; } }
  `]
})
export class DespesaFormComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  private despesasService = inject(DespesasService);
  private itensService = inject(ItensService);
  private bancosService = inject(BancosService);
  private toast = inject(ToastService);

  itens = signal<Item[]>([]);
  bancosAtivos = signal<Banco[]>([]);
  saving = signal(false);

  paymentMethods: PaymentMethod[] = ['PIX', 'DINHEIRO', 'CREDITO', 'TRANSFERENCIA', 'OUTROS'];

  private id = this.route.snapshot.paramMap.get('id');
  isEdit = computed(() => !!this.id);

  form = this.fb.group({
    itemId: ['', Validators.required],
    dataVencimento: ['', Validators.required],
    dataPagamento: [''],
    bancoCode: [null as number | null],
    paymentMethod: ['OUTROS' as PaymentMethod, Validators.required],
    valor: [null as any, Validators.required],
    descricao: [''],
  });

  constructor() {
    this.itensService.listar().subscribe(list => this.itens.set(list ?? []));
    this.bancosService.listarAtivos().subscribe(list => this.bancosAtivos.set(list ?? []));

    // se já houver edição por id no seu app, aqui carregaria despesa e patchValue
    // (mantive neutro para não inventar rotas que você não tenha)
  }

  label(pm: PaymentMethod): string {
    return PAYMENT_METHOD_LABEL[pm] ?? pm;
  }

  voltar(): void {
    this.router.navigateByUrl('/app');
  }

  salvar(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();

    const payload = {
      itemId: String(v.itemId),
      dataVencimento: String(v.dataVencimento),
      dataPagamento: v.dataPagamento ? String(v.dataPagamento) : null,
      bancoCode: v.bancoCode ?? null,
      paymentMethod: v.paymentMethod as PaymentMethod,
      valor: Number(v.valor),
      descricao: String(v.descricao ?? '')
    };

    this.saving.set(true);

    // create (MVP). Se seu app já tem update por form, chamar atualizar aqui.
    this.despesasService.criar(payload).subscribe({
      next: () => {
        this.toast.success('Despesa salva.');
        this.router.navigateByUrl('/app');
      },
      error: (err) => this.toast.error(err?.error?.message ?? 'Não foi possível salvar a despesa.'),
      complete: () => this.saving.set(false)
    });
  }
}
