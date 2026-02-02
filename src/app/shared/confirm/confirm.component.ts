import { CommonModule } from '@angular/common';
import { Component, HostListener, inject } from '@angular/core';
import { ConfirmService } from '../../services/confirm.service';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="backdrop"
         *ngIf="cs.state().open"
         [class.danger]="cs.state().danger">

      <div class="modal"
           role="dialog"
           aria-modal="true"
           [class.danger]="cs.state().danger">

        <div class="header" [class.danger]="cs.state().danger">
          <div class="title">{{ cs.state().title }}</div>
        </div>

        <div class="body">
          <div class="msg">{{ cs.state().message }}</div>

          <div class="actions">
            <button type="button" class="btn" (click)="cs.cancel()">
              {{ cs.state().cancelText }}
            </button>

            <button type="button"
                    class="btn primary"
                    [class.danger]="cs.state().danger"
                    (click)="cs.confirm()">
              {{ cs.state().confirmText }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,.35);
      display: grid;
      place-items: center;
      z-index: 2100;
      padding: 16px;
    }

    /* levemente avermelhado para deleção */
    .backdrop.danger {
      background: rgba(56, 55, 55, 0.35);
    }

    .modal {
      width: min(520px, 100%);
      background: #fff;
      border: 1px solid #4a4d53;
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(0,0,0,.18);
    }

    
    .modal.danger {
      border-color: #fecaca;
    }

    .header {
      padding: 12px 14px;
      background: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }

    
    .header.danger {
      background: #fef2f2;
      border-bottom-color: #fecaca;
    }

    .title {
      font-weight: 900;
      font-size: 16px;
      color: #111827;
    }

    /* título mais vermelho em modo danger */
    .header.danger .title {
      color: #7f1d1d;
    }

    .body { padding: 14px; }

    .msg { color: #374151; margin-bottom: 14px; }

    .actions { display: flex; justify-content: flex-end; gap: 10px; }

    .btn {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 10px 12px;
      border-radius: 10px;
      cursor: pointer;
      white-space: nowrap;
    }

    .btn.primary { background: #111827; color: #fff; border-color: #111827; }

    /* botão destrutivo vermelho oara deleção */
    .btn.primary.danger { background: #b91c1c; border-color: #b91c1c; }

    .btn:focus { outline: none; }
  `]
})
export class ConfirmComponent {
  cs = inject(ConfirmService);

  // ESC fecha
  @HostListener('window:keydown.escape')
  onEsc(): void {
    if (this.cs.state().open) this.cs.cancel();
  }
}
