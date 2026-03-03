import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenStorage } from './token.storage';
import { User } from '../../models/user.model';

interface AuthResponse {
  token: string;
  user: User;
}


@Injectable({ providedIn: 'root' })
export class AuthService {

  API_URL = 'http://localhost:3000/api';

  private userSig = signal<User | null>(null);
  private tokenSig = signal<string | null>(null);

  // estado público
  readonly isLoggedIn = computed(() => !!this.tokenSig());
  readonly user = this.userSig.asReadonly();

  constructor(
    private http: HttpClient,
    private storage: TokenStorage
  ) {
    this.tokenSig.set(this.storage.getToken());
    this.userSig.set(this.storage.getUser());
  }

  login(email: string, senha: string) {
    // pronto para backend (endpoint sugerido)
    return this.http.post<AuthResponse>('/api/auth/login', { email, senha });
  }

  /** Aplica token + user (fonte oficial após login bem-sucedido). */
  applySession(resp: AuthResponse): void {
    this.storage.setToken(resp.token);
    this.storage.setUser(resp.user);
    this.tokenSig.set(resp.token);
    this.userSig.set(resp.user);
  }

  logout(): void {
    this.storage.clearAll();
    this.tokenSig.set(null);
    this.userSig.set(null);
  }

  // helpers (para guard/interceptor/serviços)
  getToken(): string | null {
    return this.tokenSig();
  }

  /** Getter imperativo do usuário logado (útil em serviços). */
  getUser(): User | null {
    return this.userSig();
  }

  setUser(user: User) {
    return this.http.put<AuthResponse>(`${this.API_URL}/auth/register`, user);
  }

  register(user: { nome: string; email: string; senha: string; telefone?: string; avatarUrl?: string }) {
    return this.http.post<{ token: string; user: User }>(`${this.API_URL}/auth/register`, user);
  }

  /**
   * Atualiza parcialmente o usuário logado (ex.: telefone, avatarUrl),
   * persistindo no TokenStorage também.
   */
  patchUser(updates: Partial<User>): void {
    const current = this.userSig();
    if (!current) return;
    const updated: User = { ...current, ...updates };
    this.storage.setUser(updated);
    this.userSig.set(updated);
  }
}
