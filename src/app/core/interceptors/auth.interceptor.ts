import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (incoming, next) => {
  const authService = inject(AuthService);

  if (!incoming.url.startsWith(environment.apiUrl)) {
    return next(incoming);
  }

  const req = incoming.clone({ setHeaders: { 'Accept-Language': 'en' } });

  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout')
  ) {
    return next(req);
  }

  const token = authService.getToken();
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        return authService.refreshToken().pipe(
          switchMap(newToken => {
            const retryReq = req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } });
            return next(retryReq);
          }),
          catchError(refreshError => {
            authService.handleRefreshFailure();
            return throwError(() => refreshError);
          })
        );
      }
      return throwError(() => error);
    })
  );
};
