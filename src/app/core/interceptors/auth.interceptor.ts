import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { apiPath, isApiRequest } from '../utils/api-url';

const SESSIONLESS_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (incoming, next) => {
  const authService = inject(AuthService);

  if (!isApiRequest(incoming.url)) {
    return next(incoming);
  }

  const req = incoming.clone({ setHeaders: { 'Accept-Language': 'en' } });

  if (SESSIONLESS_PATHS.includes(apiPath(req.url))) {
    return next(req);
  }

  const token = authService.getToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || !token) {
        return throwError(() => error);
      }
      return authService.refreshToken(token).pipe(
        switchMap((newToken) => next(req.clone({ setHeaders: { Authorization: `Bearer ${newToken}` } }))),
      );
    }),
  );
};
