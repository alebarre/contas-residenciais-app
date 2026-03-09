import { Component, HostListener, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { ToastComponent } from '../../../shared/toast/toast.component';
import { ConfirmComponent } from '../../../shared/confirm/confirm.component';
import { LogoComponent } from '../../../shared/logo/logo.component';



@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, ToastComponent, ConfirmComponent, LogoComponent],
  template: `
    <!-- Backdrop mobile -->
    @if (isMobile() && sidebarOpen()) {
      <div class="backdrop" (click)="sidebarOpen.set(false)"></div>
    }

    <div class="shell">
      <app-sidebar
        [open]="sidebarOpen()"
        (toggle)="sidebarOpen.set(!sidebarOpen())"
      ></app-sidebar>

      <main class="content">
        <header class="topbar">
          <button type="button" class="btn" (click)="sidebarOpen.set(!sidebarOpen())">☰</button>
          <app-logo size="lg" class="topbar-logo"></app-logo>
          <div class="spacer"></div>
        </header>

        <section class="page">
          <router-outlet />
        </section>
      </main>
    </div>
    <app-toast></app-toast>
    <app-confirm></app-confirm>
  `,
  styles: [`
    .shell {
      display: flex;
      min-height: 100vh;
      background: #fff;
    }

    .content {
      flex: 1;
      min-width: 0;
      /* garante que o conteúdo nunca fique abaixo do sidebar fixo no mobile */
    }

    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 12px;
      align-items: center;
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
      font-size: 16px;
    }


    .topbar-logo { justify-self: center; }
    .spacer { width: 24px; }

    .page {
      padding: 16px;
    }

    /* Backdrop mobile */
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, .4);
      z-index: 199;
    }

    @media (max-width: 767px) {
      .shell {
        /* no mobile  */
        display: block;
      }

      .title {
        font-size: 30px;
      }

      .page {
        padding: 12px;
      }
    }
  `]
})
export class ShellComponent implements OnInit {
  sidebarOpen = signal(false);
  isMobile = signal(false);

  ngOnInit(): void {
    this.checkMobile();
    // desktop começa com sidebar aberta
    if (!this.isMobile()) {
      this.sidebarOpen.set(true);
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  private checkMobile(): void {
    this.isMobile.set(window.innerWidth < 768);
  }
}
