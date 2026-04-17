import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { ToastService } from '../../services/toast.service';

let unauthorizedHandlingInProgress = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const toast = inject(ToastService);

  const isApiRequest = req.url.startsWith('/api');
  const isAuthRequest =
    req.url.startsWith('/api/auth/login') ||
    req.url.startsWith('/api/auth/register') ||
    req.url.startsWith('/api/auth/forgot-password') ||
    req.url.startsWith('/api/auth/reset-password');

  const token = auth.getToken();

  const authReq =
    isApiRequest && token
      ? req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      })
      : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (
        err instanceof HttpErrorResponse &&
        err.status === 401 &&
        isApiRequest &&
        !isAuthRequest
      ) {
        auth.logout();

        if (!unauthorizedHandlingInProgress) {
          unauthorizedHandlingInProgress = true;

          toast.error('Sua sessão expirou. Faça login novamente.', 'Sessão expirada');
          router.navigateByUrl('/login').finally(() => {
            unauthorizedHandlingInProgress = false;
          });
        }
      }

      return throwError(() => err);
    })
  );
};
