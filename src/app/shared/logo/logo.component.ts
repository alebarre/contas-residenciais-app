import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Logo da aplicação: ícone SVG (casinha + moeda R$) + nome do app.
 * size: 'sm' (24px) | 'md' (36px, padrão) | 'lg' (52px)
 * showText: exibe o nome ao lado do ícone (padrão: true)
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="logo" [class]="'logo--' + size">
      <!-- Ícone SVG idêntico ao favicon data URI -->
      <svg [attr.width]="iconSize" [attr.height]="iconSize" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="7" fill="#111827"/>
        <polygon points="16,5 29,17 3,17" fill="white"/>
        <rect x="6" y="16" width="20" height="12" rx="1" fill="white"/>
        <rect x="13" y="21" width="6" height="7" rx="2" fill="#111827"/>
        <circle cx="25" cy="8" r="5" fill="#f59e0b" stroke="white" stroke-width="1"/>
        <text x="25" y="11.5" text-anchor="middle" font-size="6" font-weight="bold"
              fill="white" font-family="sans-serif">R$</text>
      </svg>

      <span class="logo__text" *ngIf="showText">Contas Residenciais</span>
    </div>
  `,
  styles: [`
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      text-decoration: none;
      user-select: none;
    }

    .logo svg { flex-shrink: 0; display: block; }

    .logo__text {
      font-weight: 800;
      color: #111827;
      line-height: 1.1;
      white-space: nowrap;
    }

    /* sm — 24 px */
    .logo--sm .logo__text { font-size: 15px; }

    /* md — 36 px (padrão) */
    .logo--md .logo__text { font-size: 20px; }

    /* lg — 52 px */
    .logo--lg .logo__text { font-size: 28px; }
  `]
})
export class LogoComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() showText = true;

  get iconSize(): number {
    return this.size === 'sm' ? 24 : this.size === 'lg' ? 52 : 36;
  }
}
