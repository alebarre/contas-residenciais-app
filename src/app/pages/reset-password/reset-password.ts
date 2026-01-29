import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="card">
      <h2>Redefinir senha</h2>

      <p class="sub" *ngIf="!token()">
        Token ausente. Abra o link recebido por email novamente.
      </p>

      <form *ngIf="token()" [formGroup]="form" (ngSubmit)="submit()">
        <label>Nova senha</label>
        <input type="password" formControlName="novaSenha" />
        <small class="hint" *ngIf="form.controls.novaSenha.touched && form.controls.novaSenha.invalid">
          Senha com no mínimo 6 chars.
        </small>

        <label>Confirmar nova senha</label>
        <input type="password" formControlName="confirmarNovaSenha" />
        <small class="hint" *ngIf="form.touched && form.errors?.['senhaDiferente']">
          As senhas não conferem.
        </small>

        <button type="submit" [disabled]="form.invalid || loading">Salvar</button>

        <div class="links">
          <a routerLink="/login">Voltar para o login</a>
        </div>

        <p class="success" *ngIf="success">{{ success }}</p>
        <p class="error" *ngIf="error">{{ error }}</p>
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
  `]
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = false;
  success = '';
  error = '';

  token = computed(() => this.route.snapshot.queryParamMap.get('token'));

  form = this.fb.group(
    {
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
    this.success = '';
    this.error = '';
    if (!this.token()) {
      this.error = 'Token ausente.';
      return;
    }
    if (this.form.invalid) return;

    const { novaSenha } = this.form.getRawValue();
    this.loading = true;

    // ✅ mock por enquanto
    // depois vira:
    // this.http.post('/api/auth/reset-password', { token: this.token(), newPassword: novaSenha }).subscribe(...)
    setTimeout(() => {
      this.loading = false;
      this.success = 'Senha redefinida com sucesso. Você já pode fazer login.';

      // Redireciona após um breve delay (opcional)
      setTimeout(() => this.router.navigateByUrl('/login'), 600);
    }, 300);
  }
}
