import { Injectable, signal } from '@angular/core';

export interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  state = signal<ConfirmState>({
    open: false,
    title: 'Confirmar',
    message: '',
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    danger: false
  });

  private resolver: ((value: boolean) => void) | null = null;

  ask(options: Partial<Omit<ConfirmState, 'open'>> & { message: string }): Promise<boolean> {
    // fecha qualquer anterior
    if (this.resolver) {
      this.resolver(false);
      this.resolver = null;
    }

    this.state.set({
      open: true,
      title: options.title ?? 'Confirmar',
      message: options.message,
      confirmText: options.confirmText ?? 'Confirmar',
      cancelText: options.cancelText ?? 'Cancelar',
      danger: options.danger ?? false
    });

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  confirm(): void {
    this.state.set({ ...this.state(), open: false });
    this.resolver?.(true);
    this.resolver = null;
  }

  cancel(): void {
    this.state.set({ ...this.state(), open: false });
    this.resolver?.(false);
    this.resolver = null;
  }
}
