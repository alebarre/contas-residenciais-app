import { Component, EventEmitter, Input, Output, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faHome, faCalendar, faChartBar, faFileAlt, faSignOutAlt, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthService } from '../../auth/auth.service';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { ProfileService } from '../../../services/profile.service';


@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, FontAwesomeModule],
  template: `
    <aside class="sidebar" [class.closed]="!open">
      <div class="user">
        <img class="avatar" [src]="avatarUrl()" alt="Avatar" />

        <div class="meta">
          <div class="name">{{ userName() }}</div>
          <div class="email">{{ userEmail() }}</div>
        </div>

        <button type="button" class="toggle" (click)="toggle.emit()" [title]="open ? 'Recolher' : 'Expandir'">
          <fa-icon [icon]="faChevronLeft" [flip]="!open ? 'horizontal' : undefined"></fa-icon>
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

        <a class="nav-item" routerLink="/app/perfil" routerLinkActive="active">
          <fa-icon [icon]="faUser" class="icon"></fa-icon>
          <span *ngIf="open">Perfil</span>
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
      min-width: 280px;
      border-right: 1px solid #e5e7eb;
      background: #fff;
      padding: 12px;
      transition: width .25s ease, min-width .25s ease, padding .25s ease;
      box-sizing: border-box;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .sidebar.closed {
      width: 64px;
      min-width: 64px;
      padding: 12px 8px;
    }

    .user {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 10px;
      align-items: center;
      padding: 10px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-sizing: border-box;
      flex-shrink: 0;
    }

    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      object-fit: cover;
      display: block;
      flex-shrink: 0;
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
      flex-shrink: 0;
    }

    /* MODO FECHADO: avatar centralizado + botão abaixo */
    .sidebar.closed .user {
      grid-template-columns: 1fr;
      justify-items: center;
      gap: 6px;
      padding: 6px 4px;
    }
    .sidebar.closed .meta { display: none; }
    .sidebar.closed .toggle {
      width: 40px;
      padding: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    /* Menu */
    .menu {
      display: grid;
      gap: 6px;
      margin-top: 12px;
      flex: 1;
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
      padding: 10px 4px;
    }
    .sidebar.closed .menu a .label { display: none; }

    /* Footer / Logout */
    .footer { margin-top: 12px; flex-shrink: 0; }

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
      padding: 10px 4px;
    }

    .sidebar.closed .logout .label { display: none; }

    /* ── Responsivo / Mobile ────────────────────────────── */
    @media (max-width: 767px) {
      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        z-index: 200;
        transform: translateX(0);
        transition: transform .25s ease, width .25s ease;
        width: 280px;
        min-width: 280px;
        padding: 12px;
        box-shadow: 4px 0 16px rgba(0,0,0,.12);
      }

      /* Fechado no mobile: some completamente para a esquerda */
      .sidebar.closed {
        transform: translateX(-100%);
        width: 280px;
        min-width: 280px;
        padding: 12px;
      }

      /* No mobile fechado os itens voltam ao normal (não precisam de ícone-only) */
      .sidebar.closed .user {
        grid-template-columns: auto 1fr auto;
        justify-items: unset;
        gap: 10px;
        padding: 10px;
      }
      .sidebar.closed .meta { display: block; }
      .sidebar.closed .toggle { width: auto; padding: 6px 8px; }
      .sidebar.closed .menu a {
        grid-template-columns: 24px 1fr;
        justify-items: unset;
        padding: 10px 12px;
      }
      .sidebar.closed .menu a .label { display: block; }
      .sidebar.closed .logout {
        grid-template-columns: 24px 1fr;
        justify-items: unset;
        padding: 10px 12px;
      }
      .sidebar.closed .logout .label { display: block; }
    }
  `]
})
export class SidebarComponent {
  @Input() open = true;
  @Output() toggle = new EventEmitter<void>();

  private auth = inject(AuthService);
  private profile = inject(ProfileService);
  private router = inject(Router);

  // FontAwesome Icons
  faHome = faHome;
  faCalendar = faCalendar;
  faChartBar = faChartBar;
  faFileAlt = faFileAlt;
  faSignOutAlt = faSignOutAlt;
  faChevronLeft = faChevronLeft;
  faUser = faUser;

  user = computed(() => this.auth.user());

  userName = computed(() => this.user()?.nome ?? 'Usuário');
  userEmail = computed(() => this.user()?.email ?? '');
  avatarUrl = computed(() => {
    this.profile.rev(); // dependência reativa
    const u = this.auth.user();
    return u ? this.profile.getAvatarOrDefault(u) : '';
  });


  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
