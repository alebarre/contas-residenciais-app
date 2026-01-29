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

  private userSig = signal<User | null>(null);
  private tokenSig = signal<string | null>(null);

  isLoggedIn = computed(() => !!this.tokenSig());
  user = computed(() => this.userSig());

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

  // helpers (para guard/interceptor)
  getToken(): string | null {
    return this.tokenSig();
  }
}
