import { Injectable } from '@angular/core';
import { StorageService } from './storage.service';
import { Banco } from '../../models/banco.model';
import { Despesa } from '../../models/despesa.model';
import { Item } from '../../models/item.model';

export type BanksCache = {
  updatedAt: string; // ISO
  data: Banco[];
};

export type BanksOverrides = {
  inactiveCodes: number[];
};

export type AppStorage = {
  // dados do app
  despesas: Despesa[];
  itens: Item[];
  lastIds: {
    despesa: number;
    item: number;
  };

  // bancos (catálogo via API + overrides locais)
  banksCache?: BanksCache;
  banksOverrides?: BanksOverrides;
};

const KEY = 'contas_residenciais';

const DEFAULT_STORAGE: AppStorage = {
  despesas: [],
  itens: [],
  lastIds: { despesa: 0, item: 0 },
  banksOverrides: { inactiveCodes: [] },
};

@Injectable({ providedIn: 'root' })
export class AppStorageService {
  constructor(private storage: StorageService) {}

  /**
   * Lê o estado do app e aplica defaults + migração simples de chaves antigas.
   */
  getAll(): AppStorage {
    const base = this.storage.get<any>(KEY, {});

    // Migração: itens antigos salvos em chave separada "itens"
    const legacyItensRaw = localStorage.getItem('itens');
    const legacyItens: Item[] = legacyItensRaw ? (JSON.parse(legacyItensRaw) as Item[]) : [];

    // Mantém o que já existe na KEY, mas garante defaults
    const next: AppStorage = {
      ...DEFAULT_STORAGE,
      ...base,
      despesas: Array.isArray(base?.despesas) ? (base.despesas as Despesa[]) : [],
      // se já tiver itens dentro do storage principal, usa; senão migra da chave antiga
      itens: Array.isArray(base?.itens) ? (base.itens as Item[]) : legacyItens,
      lastIds: {
        despesa: Number(base?.lastIds?.despesa ?? base?.lastId ?? 0),
        item: Number(base?.lastIds?.item ?? 0),
      },
      banksCache: base?.banksCache,
      banksOverrides: {
        inactiveCodes: Array.isArray(base?.banksOverrides?.inactiveCodes)
          ? base.banksOverrides.inactiveCodes
          : [],
      },
    };

    // Se migrou itens da chave antiga, remove a chave legada para evitar divergência
    if (!Array.isArray(base?.itens) && legacyItens.length) {
      try {
        localStorage.removeItem('itens');
      } catch {
        // ignore
      }
      this.setAll(next); // persistir migração
    }

    return next;
  }

  setAll(next: AppStorage): void {
    this.storage.set(KEY, next);
  }

  // ----- despesas -----
  getDespesas(): Despesa[] {
    return this.getAll().despesas;
  }

  setDespesas(despesas: Despesa[]): void {
    const all = this.getAll();
    all.despesas = despesas;
    this.setAll(all);
  }

  // ----- itens -----
  getItens(): Item[] {
    return this.getAll().itens;
  }

  setItens(itens: Item[]): void {
    const all = this.getAll();
    all.itens = itens;
    this.setAll(all);
  }

  // ----- ids -----
  getLastIds(): AppStorage['lastIds'] {
    return this.getAll().lastIds;
  }

  setLastIds(lastIds: AppStorage['lastIds']): void {
    const all = this.getAll();
    all.lastIds = lastIds;
    this.setAll(all);
  }

  // ----- bancos -----
  getBanksCache(): BanksCache | null {
    return this.getAll().banksCache ?? null;
  }

  setBanksCache(cache: BanksCache): void {
    const all = this.getAll();
    all.banksCache = cache;
    this.setAll(all);
  }

  getBanksOverrides(): BanksOverrides {
    return this.getAll().banksOverrides ?? { inactiveCodes: [] };
  }

  setBanksOverrides(overrides: BanksOverrides): void {
    const all = this.getAll();
    all.banksOverrides = overrides;
    this.setAll(all);
  }
}
