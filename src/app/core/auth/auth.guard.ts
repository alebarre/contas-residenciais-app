import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  // Placeholder: depois vamos trocar por token real
  const token = localStorage.getItem('token');

  if (token) return true;

  router.navigateByUrl('/login');
  return false;
};
