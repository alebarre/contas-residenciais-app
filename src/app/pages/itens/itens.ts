import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ItensService } from '../../services/itens.service';
import { Item, ItemTipo } from '../../models/item.model';

@Component({
  selector: 'app-itens',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="wrap">
      <div class="header">
        <h2>Itens</h2>
        <p class="sub">Empresas, profissionais e serviços</p>
      </div>

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

      <div class="list">
        <table>
          <thead>
            <tr>
              <th class="col-tipo">Tipo</th>
              <th class="col-nome">Nome</th>
              <th class="col-atividade">Atividade</th>
              <th class="col-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of itens()">
              <td class="col-tipo">{{ item.tipo }}</td>
              <td class="col-nome">{{ item.nome }}</td>
              <td class="col-atividade">{{ item.atividade }}</td>
              <td class="col-acoes">
                <button class="btn-sm" (click)="editar(item)">Editar</button>
                <button class="btn-sm danger" (click)="excluir(item)">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="empty" *ngIf="!itens().length">
          Nenhum item cadastrado.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { max-width: 980px; margin: 0 auto; }
    .header { margin-bottom: 12px; }
    .sub { color: #6b7280; margin: 0; }

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
    .col-acoes { width: 200px; text-align: center; white-space: nowrap; }
    .col-atividade { width: 240px; }
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

    .empty {
      padding: 12px;
      color: #6b7280;
      text-align: center;
      border: 1px dashed #e5e7eb;
      margin-top: 10px;
      border-radius: 10px;
    }

    @media (max-width: 900px) {
      .row { grid-template-columns: 1fr; }
      table { table-layout: auto; }
    }
  `]
})
export class ItensComponent {
  private service = inject(ItensService);
  private fb = inject(FormBuilder);

  itens = signal<Item[]>([]);
  editando: Item | null = null;

  form = this.fb.group({
    tipo: ['EMPRESA' as ItemTipo, Validators.required],
    nome: ['', [Validators.required, Validators.minLength(2)]],
    atividade: ['', [Validators.required, Validators.minLength(2)]],
  });

  constructor() {
    this.carregar();
  }

  carregar(): void {
    this.service.listar().subscribe(list => this.itens.set(list));
  }

  salvar(): void {
    const { tipo, nome, atividade } = this.form.getRawValue();
    if (!tipo || !nome || !atividade) return;

    if (this.editando) {
      this.service.atualizar({ ...this.editando, tipo, nome, atividade }).subscribe(() => {
        this.editando = null;
        this.form.reset({ tipo: 'EMPRESA', nome: '', atividade: '' });
        this.carregar();
      });
    } else {
      this.service.criar(tipo, nome, atividade).subscribe(() => {
        this.form.reset({ tipo: 'EMPRESA', nome: '', atividade: '' });
        this.carregar();
      });
    }
  }

  editar(item: Item): void {
    this.editando = item;
    this.form.setValue({ tipo: item.tipo, nome: item.nome, atividade: item.atividade });
  }

  excluir(item: Item): void {
    if (!confirm(`Excluir "${item.nome}"?`)) return;
    this.service.excluir(item.id).subscribe(() => this.carregar());
  }
}
