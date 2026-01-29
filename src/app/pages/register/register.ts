import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="card">
      <h2>Criar conta</h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Nome</label>
        <input type="text" formControlName="nome" />
        <small class="hint" *ngIf="form.controls.nome.touched && form.controls.nome.invalid">
          Informe seu nome (mín. 3 chars).
        </small>

        <label>Email</label>
        <input type="email" formControlName="email" />
        <small class="hint" *ngIf="form.controls.email.touched && form.controls.email.invalid">
          Informe um email válido.
        </small>

        <label>Senha</label>
        <input type="password" formControlName="senha" />
        <small class="hint" *ngIf="form.controls.senha.touched && form.controls.senha.invalid">
          Senha com no mínimo 6 chars.
        </small>

        <label>Confirmar senha</label>
        <input type="password" formControlName="confirmarSenha" />
        <small class="hint" *ngIf="form.touched && form.errors?.['senhaDiferente']">
          As senhas não conferem.
        </small>

        <button type="submit" [disabled]="form.invalid || loading">Cadastrar</button>

        <div class="links">
          <a routerLink="/login">Voltar para o login</a>
        </div>

        <p class="error" *ngIf="error">{{ error }}</p>
      </form>
    </div>
  `,
  styles: [`
    .card { max-width: 460px; margin: 40px auto; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
    form { display: grid; gap: 10px; }
    input { padding: 10px; border: 1px solid #e5e7eb; border-radius: 10px; }
    button { padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb; background: #111827; color: #fff; cursor: pointer; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .links { display: flex; justify-content: flex-end; font-size: 14px; }
    .error { color: #b91c1c; margin: 0; }
    .hint { color: #6b7280; }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = false;
  error = '';

  form = this.fb.group(
    {
      nome: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', [Validators.required, Validators.minLength(6)]],
    },
    { validators: [this.passwordMatchValidator] }
  );

  private passwordMatchValidator(group: any) {
    const senha = group.get('senha')?.value;
    const confirmar = group.get('confirmarSenha')?.value;
    return senha && confirmar && senha !== confirmar ? { senhaDiferente: true } : null;
  }

  submit(): void {
    this.error = '';
    if (this.form.invalid) return;

    const { nome, email } = this.form.getRawValue();
    this.loading = true;

    // ✅ mock (enquanto não há backend)
    // depois vira: this.http.post('/api/auth/register', {...}).subscribe(...)
    setTimeout(() => {
      this.auth.applySession({
        token: 'fake-jwt-token',
        user: { nome: nome!, email: email!, avatarUrl: 'https://i.pravatar.cc/80' }
      });

      this.loading = false;
      this.router.navigateByUrl('/app/dashboard');
    }, 300);
  }
}
