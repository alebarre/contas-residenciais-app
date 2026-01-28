import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('../app/pages/login/login').then(m => m.Login) },
  { path: 'register', loadComponent: () => import('../app/pages/register/register').then(m => m.Register) },
  { path: 'forgot-password', loadComponent: () => import('../app/pages/forgot-password/forgot-password').then(m => m.ForgotPassword) },
  { path: 'reset-password', loadComponent: () => import('../app/pages/reset-password/reset-password').then(m => m.ResetPassword) },

  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('../app/core/layout/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('../app/pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'itens', loadComponent: () => import('../app/pages/itens/itens').then(m => m.Itens) },
      { path: 'relatorio-mensal', loadComponent: () => import('../app/pages/relatorio-mensal/relatorio-mensal').then(m => m.RelatorioMensal) },
      { path: 'relatorio-anual', loadComponent: () => import('../app/pages/relatorio-anual/relatorio-anual').then(m => m.RelatorioAnual) },
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
    ]
  },

  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: '**', redirectTo: 'login' },
];
