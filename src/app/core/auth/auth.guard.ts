import { inject } from '@angular/core';
import {
  CanActivateChildFn,
  CanActivateFn,
  Router,
  UrlTree,
} from '@angular/router';
import { AuthService } from './auth.service';

function validateSession(): true | UrlTree {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.hasValidSession()) {
    return true;
  }

  auth.logout();
  return router.createUrlTree(['/login']);
}

export const authGuard: CanActivateFn = () => {
  return validateSession();
};

export const authChildGuard: CanActivateChildFn = () => {
  return validateSession();
};
