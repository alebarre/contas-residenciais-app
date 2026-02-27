import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

export type PatchMeRequest = {
  telefone?: string | null;
  avatarUrl?: string | null;
};

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private http = inject(HttpClient);

  private revSig = signal(0);
  readonly rev = this.revSig.asReadonly();

  /** Recarrega user do backend (fonte de verdade do perfil) */
  getMe(): Observable<User> {
    return this.http.get<User>('/api/me');
  }

  /** Persiste telefone/avatar no backend */
  patchMe(patch: PatchMeRequest): Observable<User> {
    return this.http.patch<User>('/api/me', patch).pipe(
      tap(() => this.revSig.update(v => v + 1))
    );
  }

  /** Avatar para UI: usa o avatarUrl do user, ou fallback genérico */
  getAvatarOrDefault(user: User): string {
    const avatar = (user.avatarUrl ?? '').trim();
    return avatar ? avatar : DEFAULT_AVATAR_DATA_URL;
  }
}

// Avatar genérico (SVG) — sem depender de assets
const DEFAULT_AVATAR_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
    <rect width="96" height="96" rx="48" fill="#e5e7eb"/>
    <circle cx="48" cy="38" r="18" fill="#9ca3af"/>
    <path d="M18 86c6-18 22-26 30-26s24 8 30 26" fill="#9ca3af"/>
  </svg>
`);
