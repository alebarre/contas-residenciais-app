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

  readonly isLoggedIn = computed(() => !!this.getToken());
  readonly user = this.userSig.asReadonly();

  constructor(
    private http: HttpClient,
    private storage: TokenStorage
  ) {
    this.syncSessionFromStorage();
  }

  login(email: string, senha: string) {
    return this.http.post<AuthResponse>('/api/auth/login', { email, senha });
  }

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

  getToken(): string | null {
    this.syncSessionFromStorage();

    const token = this.tokenSig();
    if (!token) return null;

    if (this.isTokenExpired(token)) {
      this.logout();
      return null;
    }

    return token;
  }

  getUser(): User | null {
    this.syncSessionFromStorage();
    return this.userSig();
  }

  register(user: {
    nome: string;
    email: string;
    senha: string;
    telefone?: string;
    avatarUrl?: string;
  }) {
    return this.http.post<AuthResponse>('/api/auth/register', user);
  }

  patchUser(updates: Partial<User>): void {
    const current = this.userSig();
    if (!current) return;

    const updated: User = { ...current, ...updates };
    this.storage.setUser(updated);
    this.userSig.set(updated);
  }

  hasValidSession(): boolean {
    return !!this.getToken();
  }

  private syncSessionFromStorage(): void {
    const storageToken = this.storage.getToken();
    const storageUser = this.storage.getUser();

    if (!storageToken) {
      if (this.tokenSig() || this.userSig()) {
        this.tokenSig.set(null);
        this.userSig.set(null);
      }
      return;
    }

    if (this.isTokenExpired(storageToken)) {
      this.logout();
      return;
    }

    if (this.tokenSig() !== storageToken) {
      this.tokenSig.set(storageToken);
    }

    this.userSig.set(storageUser);
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return true;

      const normalized = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(
        normalized.length + ((4 - (normalized.length % 4)) % 4),
        '='
      );

      const payloadJson = atob(padded);
      const payload = JSON.parse(payloadJson) as { exp?: number };

      if (!payload.exp) return true;

      const nowInSeconds = Math.floor(Date.now() / 1000);
      return payload.exp <= nowInSeconds;
    } catch {
      return true;
    }
  }
}
