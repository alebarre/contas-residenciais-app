import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <div class="toast"
          *ngFor="let t of toastService.toasts()"
          [class.success]="t.type==='success'"
          [class.error]="t.type==='error'"
          [class.info]="t.type==='info'">

        <div class="left">
          <div class="title" *ngIf="t.title">{{ t.title }}</div>
          <div class="msg">{{ t.message }}</div>

          <button class="action"
                  *ngIf="t.action"
                  type="button"
                  (click)="t.action.onClick(); toastService.dismiss(t.id)">
            {{ t.action.label }}
          </button>
        </div>

        <button class="x" type="button" (click)="toastService.dismiss(t.id)">×</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-stack {
      position: fixed;
      top: 16px;
      right: 16px;
      display: grid;
      gap: 10px;
      z-index: 2000;
      width: min(360px, calc(100vw - 32px));
    }

    .toast {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      padding: 12px 12px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      background: #fff;
      box-shadow: 0 10px 25px rgba(0,0,0,.08);
    }

    .action{
      margin-top: 8px;
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 6px 10px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
    }


    .toast.success { background: #f0fdf4; border-color: #bbf7d0; }
    .toast.error { background: #fef2f2; border-color: #fecaca; }
    .toast.info { background: #eff6ff; border-color: #bfdbfe; }

    .title { font-weight: 800; color: #111827; margin-bottom: 2px; }
    .msg { color: #374151; font-weight: 500; }

    .x {
      border: 1px solid #e5e7eb;
      background: #fff;
      width: 28px;
      height: 28px;
      border-radius: 10px;
      cursor: pointer;
      line-height: 24px;
      font-size: 18px;
      color: #374151;
    }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
}
