import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () =>
  inject(AuthService).isAdminSession() ? inject(Router).createUrlTree(['/']) : true;
