import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  template: `
    <div class="shell">
      <app-sidebar
        [open]="sidebarOpen()"
        (toggle)="sidebarOpen.set(!sidebarOpen())"
      ></app-sidebar>

      <main class="content">
        <header class="topbar">
          <button type="button" class="btn" (click)="sidebarOpen.set(!sidebarOpen())">☰</button>
          <div class="title">Contas Residenciais</div>
          <div class="spacer"></div>
        </header>

        <section class="page">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
  styles: [`
    .shell { display: flex; min-height: 100vh; background: #fff; }
    .content { flex: 1; min-width: 0; }

    .topbar {
      position: sticky; top: 0; z-index: 10;
      display: grid; grid-template-columns: auto 1fr auto;
      gap: 12px; align-items: center;
      padding: 12px 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #fff;
    }

    .btn {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 6px 10px;
      border-radius: 8px;
      cursor: pointer;
    }

    .title { font-weight: 600; text-align: center; }
    .spacer { width: 24px; }

    .page { padding: 16px; }
  `]
})
export class ShellComponent {
  sidebarOpen = signal(true);
}
