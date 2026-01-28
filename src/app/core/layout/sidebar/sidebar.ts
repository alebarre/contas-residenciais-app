import { Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="sidebar" [class.closed]="!open">
      <div class="user">
        <img class="avatar" [src]="avatarUrl" alt="avatar" />

        <div class="meta">
          <div class="name">{{ userName }}</div>
          <div class="email">{{ userEmail }}</div>
        </div>

        <button type="button" class="toggle" (click)="toggle.emit()">⇆</button>
      </div>

      <nav class="menu">
        <a routerLink="/app/dashboard" routerLinkActive="active">
          <span class="icon">🏠</span>
          <span class="label">Dashboard</span>
        </a>

        <a routerLink="/app/relatorio-mensal" routerLinkActive="active">
          <span class="icon">📅</span>
          <span class="label">Relatório mensal</span>
        </a>

        <a routerLink="/app/relatorio-anual" routerLinkActive="active">
          <span class="icon">📊</span>
          <span class="label">Relatório anual</span>
        </a>

        <a routerLink="/app/itens" routerLinkActive="active">
          <span class="icon">🧾</span>
          <span class="label">Itens</span>
        </a>
      </nav>
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

    /* ✅ MODO FECHADO: mantém avatar e botão, esconde textos */
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

    /* ✅ Fechado: só ícones no menu */
    .sidebar.closed .menu a {
      grid-template-columns: 1fr;
      justify-items: center;
      padding: 10px 0;
    }

    .sidebar.closed .menu a .label { display: none; }
  `]
})
export class SidebarComponent {
  @Input() open = true;
  @Output() toggle = new EventEmitter<void>();

  // Placeholder: depois vamos ler do AuthService (usuário logado)
  userName = 'Usuário';
  userEmail = 'usuario@email.com';
  avatarUrl = 'https://i.pravatar.cc/80';
}
