import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="card">
      <h2>Redefinir senha</h2>
      <p class="sub">Informe o email, o código recebido e a nova senha.</p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Email</label>
        <input type="email" formControlName="email" />

        <label>Código recebido por email</label>
        <input type="text" formControlName="code" />

        <small class="hint error"
               *ngIf="form.controls.code.touched && form.controls.code.invalid">
          Informe o código recebido por email.
        </small>

        <label>Nova senha</label>
        <input type="password" formControlName="novaSenha" />

        <label>Confirmar nova senha</label>
        <input type="password" formControlName="confirmarNovaSenha" />

        <small class="hint error"
               *ngIf="form.touched && form.errors?.['senhaDiferente']">
          As senhas não conferem.
        </small>

        <button type="submit" [disabled]="form.invalid || loading()">Salvar</button>

        <div class="links">
          <a routerLink="/login">Voltar para o login</a>
        </div>

        <p class="success" *ngIf="success()">{{ success() }}</p>
        <p class="error" *ngIf="error()">{{ error() }}</p>
      </form>
    </div>
  `,
  styles: [`
    .card { max-width: 460px; margin: 40px auto; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
    .sub { color: #6b7280; margin-top: 0; }
    form { display: grid; gap: 10px; }
    input { padding: 10px; border: 1px solid #e5e7eb; border-radius: 10px; }
    button { padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb; background: #111827; color: #fff; cursor: pointer; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .links { display: flex; justify-content: flex-end; font-size: 14px; }
    .success { color: #065f46; margin: 0; }
    .error { color: #b91c1c; margin: 0; }
    .hint { color: #6b7280; }
    .hint.error { color: #b91c1c; }
  `]
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = signal(false);
  success = signal('');
  error = signal('');

  form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email]],
      code: ['', [Validators.required, Validators.minLength(4)]],
      novaSenha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarNovaSenha: ['', [Validators.required, Validators.minLength(6)]],
    },
    { validators: [this.passwordMatchValidator] }
  );

  private passwordMatchValidator(group: any) {
    const a = group.get('novaSenha')?.value;
    const b = group.get('confirmarNovaSenha')?.value;
    return a && b && a !== b ? { senhaDiferente: true } : null;
  }

  submit(): void {
    this.success.set('');
    this.error.set('');
    if (this.form.invalid) return;

    const { email, code, novaSenha } = this.form.getRawValue();
    this.loading.set(true);

    this.http.post('/api/auth/reset-password', {
      email,
      code,
      newPassword: novaSenha
    }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set('Senha redefinida com sucesso. Você já pode fazer login.');
        setTimeout(() => this.router.navigateByUrl('/login'), 2500); //
      },
      error: (err) => {
        console.error(err);
        this.loading.set(false);

        const errCode = err?.error?.code;

        if (errCode === 'INVALID_RESET_CODE') {
          this.error.set(err?.error?.message ?? 'Código inválido. Verifique e tente novamente.');
          return;
        }

        if (errCode === 'RESET_CODE_EXPIRED') {
          this.error.set(err?.error?.message ?? 'Código expirado. Volte e solicite um novo código.');
          return;
        }

        this.error.set(err?.error?.message ?? 'Não foi possível redefinir a senha.');
      }
    });
  }
}
