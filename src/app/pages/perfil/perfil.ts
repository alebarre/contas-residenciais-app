import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { ProfileService } from '../../services/profile.service';
import { ToastService } from '../../services/toast.service';
import { User } from '../../models/user.model';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="wrap">
      <div class="head">
        <div>
          <h2>Perfil</h2>
          <p class="sub">Dados do usuário</p>
        </div>
        <button type="button" class="btn" (click)="voltar()">Voltar</button>
      </div>

      <div class="card" *ngIf="user() as u">
        <div class="grid">
          <div class="avatar">
            <img [src]="avatarUrl()" alt="Avatar" />
            <label class="btn-sm">
              Alterar avatar
              <input type="file" accept="image/*" (change)="onFile($event)" hidden />
            </label>
            <button type="button" class="btn-sm danger" (click)="removerAvatar()" [disabled]="!hasAvatar()">
              Remover
            </button>
            <small class="hint">Avatar/telefone são persistidos no servidor.</small>
          </div>

          <div class="fields">
            <div class="field">
              <label>Nome</label>
              <input type="text" [value]="u.nome" disabled />
            </div>

            <div class="field">
              <label>Email</label>
              <input type="text" [value]="u.email" disabled />
            </div>

            <form class="field" [formGroup]="form" (ngSubmit)="salvar()">
              <label>Telefone</label>
              <input
                type="text"
                formControlName="telefone"
                placeholder="(xx) xxxxx-xxxx"
                (input)="onTelefoneInput($event)"
              />
              <div class="err" *ngIf="fieldErrorTelefone()">
                {{ fieldErrorTelefone() }}
              </div>
              <div class="actions">
                <button type="submit" class="btn primary" [disabled]="form.invalid || saving()">
                  {{ saving() ? 'Salvando...' : 'Salvar' }}
                </button>
              </div>

              <div class="err" *ngIf="form.get('telefone')?.touched && form.get('telefone')?.errors?.['telefoneInvalido']">
                Telefone inválido (use 10 ou 11 dígitos).
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { max-width: 980px; margin: 0 auto; }
    .head { display:flex; justify-content:space-between; align-items:flex-end; gap:12px; margin-bottom:12px; }
    h2 { margin:0; }
    .sub { margin: 2px 0 0; color:#6b7280; }
    .card { border:1px solid #e5e7eb; background:#fff; border-radius:12px; padding:12px; }
    .grid { display:grid; grid-template-columns: 260px 1fr; gap:16px; }
    .avatar { display:grid; gap:10px; align-content:start; }
    .avatar img { width:160px; height:160px; border-radius:999px; object-fit:cover; border:1px solid #e5e7eb; }
    .fields { display:grid; gap:10px; }
    .field { display:grid; gap:6px; }
    label { font-size:12px; color:#374151; }
    input { padding:10px; border:1px solid #e5e7eb; border-radius:10px; }
    .hint { color:#6b7280; font-size:12px; }
    .actions { margin-top:8px; display:flex; justify-content:flex-end; }
    .btn { border:1px solid #e5e7eb; background:#fff; padding:10px 12px; border-radius:10px; cursor:pointer; }
    .btn.primary { background:#111827; color:#fff; border-color:#111827; }
    .btn-sm { border:1px solid #e5e7eb; background:#fff; padding:6px 8px; border-radius:10px; cursor:pointer; width:max-content; }
    .btn-sm.danger { border-color:#fecaca; }
    .err { color:#b91c1c; font-size:12px; margin-top:6px; }
    @media (max-width: 900px){ .grid{ grid-template-columns: 1fr; } }
  `]
})
export class PerfilComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private auth = inject(AuthService);
  private profile = inject(ProfileService);
  private toast = inject(ToastService);

  user = computed<User | null>(() => this.auth.user());
  avatarUrl = signal<string>('');
  hasAvatar = signal<boolean>(false);
  saving = signal<boolean>(false);

  form = this.fb.group({
    telefone: ['', [this.telefoneBrValidator]]
  });

  constructor() {
    // Ao entrar no perfil, recarrega do backend (fonte de verdade) e atualiza a sessão
    this.profile.getMe().subscribe({
      next: (u) => {
        this.auth.setUser(u);
        this.avatarUrl.set(this.profile.getAvatarOrDefault(u));
        this.hasAvatar.set(!!(u.avatarUrl ?? '').trim());
        this.form.patchValue({ telefone: u.telefone ?? '' }, { emitEvent: false });
      },
      error: () => {
        // fallback: usa o user local, se existir
        const u = this.user();
        if (u) {
          this.avatarUrl.set(this.profile.getAvatarOrDefault(u));
          this.hasAvatar.set(!!(u.avatarUrl ?? '').trim());
          this.form.patchValue({ telefone: u.telefone ?? '' }, { emitEvent: false });
        }
      }
    });
  }

  voltar(): void {
    this.router.navigateByUrl('/app');
  }

  fieldErrorTelefone = signal<string>('');

  salvar(): void {
    const u = this.user();
    if (!u) return;

    this.fieldErrorTelefone.set('');
    this.form.get('telefone')?.setErrors(null);

    const telefoneRaw = (this.form.value.telefone ?? '').trim();
    const telefoneDigits = telefoneRaw.replace(/\D/g, '');

    this.saving.set(true);
    this.profile.patchMe({ telefone: telefoneDigits || null }).subscribe({
      next: (updated) => {
        this.auth.setUser(updated);
        this.toast.success('Perfil atualizado.');
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);

        const api = err?.error;
        const fieldErrors = api?.fieldErrors as Array<{ field: string; message: string }> | undefined;

        const telMsg = fieldErrors?.find(e => e.field === 'telefone')?.message;
        if (telMsg) {
          this.fieldErrorTelefone.set(telMsg);
          this.form.get('telefone')?.setErrors({ backend: true });
          this.form.get('telefone')?.markAsTouched();
          this.toast.error(telMsg);
          return;
        }

        this.toast.error(api?.message ?? 'Não foi possível salvar o perfil.');
      }
    });
  }

  removerAvatar(): void {
    const u = this.user();
    if (!u) return;

    this.saving.set(true);
    this.profile.patchMe({ avatarUrl: null }).subscribe({
      next: (updated) => {
        this.auth.setUser(updated);
        this.avatarUrl.set(this.profile.getAvatarOrDefault(updated));
        this.hasAvatar.set(false);
        this.toast.info('Avatar removido.');
      },
      error: () => this.toast.error('Não foi possível remover o avatar.'),
      complete: () => this.saving.set(false)
    });
  }

  async onFile(ev: Event): Promise<void> {
    const u = this.user();
    if (!u) return;

    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // hardening: evita base64 gigante
    if (file.size > 1_200_000) {
      this.toast.error('Imagem muito grande. Use até ~1.2MB.');
      input.value = '';
      return;
    }

    const dataUrl = await this.fileToDataUrl(file);

    this.saving.set(true);
    this.profile.patchMe({ avatarUrl: dataUrl }).subscribe({
      next: (updated) => {
        this.auth.setUser(updated);
        this.avatarUrl.set(this.profile.getAvatarOrDefault(updated));
        this.hasAvatar.set(true);
        this.toast.success('Avatar atualizado.');
      },
      error: () => this.toast.error('Não foi possível salvar o avatar.'),
      complete: () => this.saving.set(false)
    });

    input.value = '';
  }

  private fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onerror = () => reject(new Error('Falha ao ler arquivo'));
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(file);
    });
  }

  onTelefoneInput(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const formatted = this.formatTelefoneBR(input.value);
    if (formatted !== this.form.value.telefone) {
      this.form.patchValue({ telefone: formatted }, { emitEvent: false });
    }
  }

  private formatTelefoneBR(value: string): string {
    const digits = (value ?? '').replace(/\D/g, '').slice(0, 11);

    if (digits.length >= 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
    if (digits.length >= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
    if (digits.length >= 3) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length >= 1) return `(${digits}`;
    return '';
  }

  telefoneBrValidator(ctrl: AbstractControl): ValidationErrors | null {
    const v = String(ctrl.value ?? '');
    const digits = v.replace(/\D/g, '');
    if (!digits) return null; // opcional
    return (digits.length === 10 || digits.length === 11) ? null : { telefoneInvalido: true };
  }
}
