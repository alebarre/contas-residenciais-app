import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="card">
      <h2>Login</h2>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Email</label>
        <input type="email" formControlName="email" />

        <label>Senha</label>
        <input type="password" formControlName="senha" />

        <button type="submit" [disabled]="form.invalid || loading">Entrar</button>

        <div class="links">
          <a routerLink="/register">Criar conta</a>
          <a routerLink="/forgot-password">Esqueci minha senha</a>
        </div>

        <p class="error" *ngIf="error">{{ error }}</p>
      </form>
    </div>
  `,
  styles: [`
    .card { max-width: 420px; margin: 40px auto; padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; }
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

  loading = false;
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]],
  });

  submit(): void {
    this.error = '';
    if (this.form.invalid) return;

    const { email, senha } = this.form.getRawValue();
    this.loading = true;

    // ✅ enquanto não há backend: simula sucesso
    // Quando o backend estiver pronto, trocamos por this.auth.login(email!, senha!).subscribe(...)
    setTimeout(() => {
      this.auth.applySession({
        token: 'fake-jwt-token',
        user: { nome: 'Alexandre', email: email! , avatarUrl: 'https://i.pravatar.cc/80' }
      });

      this.loading = false;
      this.router.navigateByUrl('/app/dashboard');
    }, 300);
  }
}
