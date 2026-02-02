import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  title?: string;
  message: string;
  timeoutMs?: number; // default 3500
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(toast: Omit<Toast, 'id'>): void {
    const id = Date.now();
    const timeoutMs = toast.timeoutMs ?? 3500;

    this.toasts.set([...this.toasts(), { ...toast, id, timeoutMs }]);

    window.setTimeout(() => this.dismiss(id), timeoutMs);
  }

  success(message: string, title = 'Sucesso'): void {
    this.show({ type: 'success', title, message });
  }

  error(message: string, title = 'Erro'): void {
    this.show({ type: 'error', title, message, timeoutMs: 5000 });
  }

  info(message: string, title = 'Info'): void {
    this.show({ type: 'info', title, message });
  }

  dismiss(id: number): void {
    this.toasts.set(this.toasts().filter(t => t.id !== id));
  }

  clear(): void {
    this.toasts.set([]);
  }
}
