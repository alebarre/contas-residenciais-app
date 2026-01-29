import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="card">
      <h2>Esqueci minha senha</h2>
      <p class="sub">
        Informe seu email. Se existir uma conta, enviaremos um link de redefinição.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Email</label>
        <input type="email" formControlName="email" />

        <button type="submit" [disabled]="form.invalid || loading">Enviar link</button>

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
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  loading = false;
  success = '';
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    this.success = '';
    this.error = '';
    if (this.form.invalid) return;

    const { email } = this.form.getRawValue();
    this.loading = true;

    // ✅ mock por enquanto
    // depois vira:
    // this.http.post('/api/auth/forgot-password', { email }).subscribe(...)
    setTimeout(() => {
      this.loading = false;
      this.success = 'Se o email estiver cadastrado, você receberá um link para redefinir a senha.';
    }, 300);
  }
}
