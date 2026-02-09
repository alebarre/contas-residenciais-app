import { inject, Injectable } from '@angular/core';
import { StorageService } from '../data/storage/storage.service';
import { User } from '../models/user.model';
import { signal } from '@angular/core';


type UserProfilePatch = {
  telefone?: string | null;
  avatarUrl?: string | null;
  updatedAt: string;
};

const STORAGE_KEY = 'userProfileByEmail';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private revSig = signal(0);
  readonly rev = this.revSig.asReadonly();

  private storage = inject(StorageService);

  private keyOf(user: User): string {
    return (user.email ?? '').trim().toLowerCase();
  }

  load(user: User): UserProfilePatch {
    const key = this.keyOf(user);
    const all = this.storage.get<Record<string, UserProfilePatch>>(STORAGE_KEY, {});
    return all[key] ?? { telefone: null, avatarUrl: null, updatedAt: new Date().toISOString() };
  }

  upsert(user: User, patch: Partial<UserProfilePatch>): UserProfilePatch {
    const key = this.keyOf(user);
    const all = this.storage.get<Record<string, UserProfilePatch>>(STORAGE_KEY, {});
    const current = all[key] ?? { telefone: null, avatarUrl: null, updatedAt: new Date().toISOString() };

    const updated: UserProfilePatch = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    };

    all[key] = updated;
    this.storage.set(STORAGE_KEY, all);
    this.revSig.update(v => v + 1);
    return updated;
  }

  clear(user: User): void {
    const key = this.keyOf(user);
    const all = this.storage.get<Record<string, UserProfilePatch>>(STORAGE_KEY, {});
    delete all[key];
    this.storage.set(STORAGE_KEY, all);
    this.revSig.update(v => v + 1);
  }

  getAvatarOrDefault(user: User): string {
    const local = this.load(user);
    const avatar = (local.avatarUrl ?? user.avatarUrl ?? '').trim();
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
