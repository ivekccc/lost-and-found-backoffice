import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../../shared/services/toast.service';
import { apiPath, isApiRequest } from '../utils/api-url';
import { describeHttpError } from '../utils/http-error';

const SILENT_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const toastService = inject(ToastService);
  const isApiCall = isApiRequest(request.url);
  const isRead = request.method === 'GET';
  const isSilent = SILENT_PATHS.includes(apiPath(request.url));

  return next(request).pipe(
    catchError((error: unknown) => {
      if (isApiCall && !isRead && !isSilent && error instanceof HttpErrorResponse && error.status !== 401) {
        const described = describeHttpError(error);
        toastService.error(described.title, { detail: described.detail });
      }
      return throwError(() => error);
    }),
  );
};
