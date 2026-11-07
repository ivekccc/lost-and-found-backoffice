import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (_route, state) => {
  if (inject(AuthService).isAdminSession()) {
    return true;
  }
  return inject(Router).createUrlTree(['/login'], { queryParams: state.url && state.url !== '/' ? { returnUrl: state.url } : {} });
};
