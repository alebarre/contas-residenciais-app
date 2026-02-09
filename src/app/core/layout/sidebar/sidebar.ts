import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faCalendar, faChartBar, faFileAlt, faSignOutAlt, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FontAwesomeModule],
  template: `
    <aside class="sidebar" [class.closed]="!open">
      <div class="user">
        <img class="avatar" [src]="avatarUrl()" alt="avatar" />

        <div class="meta">
          <div class="name">{{ userName() }}</div>
          <div class="email">{{ userEmail() }}</div>
        </div>

        <button type="button" class="toggle" (click)="toggle.emit()" [title]="open ? 'Recolher' : 'Expandir'">
          <fa-icon [icon]="faChevronLeft" [flip]="!open ? 'horizontal' : ''"></fa-icon>
        </button>
      </div>

      <nav class="menu">
        <a routerLink="/app/dashboard" routerLinkActive="active" title="Dashboard">
          <fa-icon [icon]="faHome" class="icon"></fa-icon>
          <span class="label">Dashboard</span>
        </a>

        <a routerLink="/app/relatorio-mensal" routerLinkActive="active" title="Relatório Mensal">
          <fa-icon [icon]="faCalendar" class="icon"></fa-icon>
          <span class="label">Relatório mensal</span>
        </a>

        <a routerLink="/app/relatorio-anual" routerLinkActive="active" title="Relatório Anual">
          <fa-icon [icon]="faChartBar" class="icon"></fa-icon>
          <span class="label">Relatório anual</span>
        </a>

        <a routerLink="/app/itens" routerLinkActive="active" title="Itens">
          <fa-icon [icon]="faFileAlt" class="icon"></fa-icon>
          <span class="label">Itens</span>
        </a>
      </nav>

      <div class="footer">
        <button type="button" class="logout" (click)="logout()" title="Sair da aplicação">
          <fa-icon [icon]="faSignOutAlt" class="icon"></fa-icon>
          <span class="label">Sair</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      border-right: 1px solid #e5e7eb;
      background: #fff;
      padding: 12px;
      transition: width .2s ease;
      box-sizing: border-box;
    }

    .sidebar.closed { width: 72px; }

    .user {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-sizing: border-box;
    }

    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
    }

    .meta { overflow: hidden; }

    .name {
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .email {
      font-size: 12px;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toggle {
      border: 1px solid #e5e7eb;
      background: #fff;
      padding: 6px 8px;
      border-radius: 8px;
      cursor: pointer;
      position: relative;
      z-index: 2;
    }

    /* MODO FECHADO: mantém avatar + botão, some meta */
    .sidebar.closed .user {
      grid-template-columns: 1fr;
      justify-items: center;
      gap: 8px;
    }
    .sidebar.closed .meta { display: none; }
    .sidebar.closed .toggle { width: 44px; }

    /* Menu */
    .menu {
      display: grid;
      gap: 6px;
      margin-top: 12px;
    }

    .menu a {
      display: grid;
      grid-template-columns: 24px 1fr;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      border-radius: 10px;
      text-decoration: none;
      color: #111827;
      border: 1px solid transparent;

      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      box-sizing: border-box;
    }

    .menu a.active {
      border-color: #e5e7eb;
      background: #f9fafb;
    }

    .icon { width: 24px; text-align: center; }

    /* Fechado: só ícones */
    .sidebar.closed .menu a {
      grid-template-columns: 1fr;
      justify-items: center;
      padding: 10px 0;
    }
    .sidebar.closed .menu a .label { display: none; }

    /* Footer / Logout */
    .footer { margin-top: 12px; }

    .logout {
      width: 100%;
      display: grid;
      grid-template-columns: 24px 1fr;
      gap: 10px;
      align-items: center;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      background: #fff;
      cursor: pointer;
      box-sizing: border-box;
    }

    .sidebar.closed .logout {
      grid-template-columns: 1fr;
      justify-items: center;
      padding: 10px 0;
    }

    .sidebar.closed .logout .label { display: none; }
  `]
})
export class SidebarComponent {
  @Input() open = true;
  @Output() toggle = new EventEmitter<void>();

  private auth = inject(AuthService);
  private router = inject(Router);

  // FontAwesome Icons
  faHome = faHome;
  faCalendar = faCalendar;
  faChartBar = faChartBar;
  faFileAlt = faFileAlt;
  faSignOutAlt = faSignOutAlt;
  faChevronLeft = faChevronLeft;

  user = computed(() => this.auth.user());

  userName = computed(() => this.user()?.nome ?? 'Usuário');
  userEmail = computed(() => this.user()?.email ?? '');
  avatarUrl = computed(() => this.user()?.avatarUrl ?? 'https://i.pravatar.cc/80');

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
