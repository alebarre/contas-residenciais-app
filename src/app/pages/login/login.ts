import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { LogoComponent } from '../../shared/logo/logo.component';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LogoComponent],
  template: `
    <div class="page-wrap">
    <div class="card">
      <div class="brand">
        <app-logo size="lg"></app-logo>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Email</label>
        <input type="email" formControlName="email" />

        <label>Senha</label>
        <input type="password" formControlName="senha" />

        <button type="submit" [disabled]="form.invalid || loading()">Entrar</button>

        <div class="links">
          <a routerLink="/register">Criar conta</a>
          <a routerLink="/forgot-password">Esqueci minha senha</a>
        </div>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
      </form>
    </div>
    </div>
  `,
  styles: [`
    .page-wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #f9fafb; padding: 16px; }
    .card { width: 100%; max-width: 420px; padding: 28px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background: #fff; box-shadow: 0 4px 24px rgba(0,0,0,.06); }
    .brand { display: flex; justify-content: center; margin-bottom: 28px; padding-bottom: 20px; border-bottom: 1px solid #f3f4f6; }
    form { display: grid; gap: 10px; }
    input { padding: 10px; border: 1px solid #e5e7eb; border-radius: 10px; }
    button { padding: 10px; border-radius: 10px; border: 1px solid #e5e7eb; background: #111827; color: #fff; cursor: pointer; }
    button:disabled { opacity: .6; cursor: not-allowed; }
    .links { display: flex; justify-content: space-between; font-size: 14px; }
    .error { color: #b91c1c; margin: 0; }
  `]
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    this.error.set('');
    if (this.form.invalid) return;

    const { email, senha } = this.form.getRawValue();
    this.loading.set(true);

    this.auth.login(email!, senha!).subscribe({
      next: (resp) => {
        this.auth.applySession(resp);
        this.loading.set(false);
        this.router.navigateByUrl('/app/dashboard');
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message ?? 'Falha no login');
      }
    });
  }

}
