import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { ShellComponent } from './core/layout/shell/shell.component';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.component')
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component')
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/reports/reports.component')
      },
      {
        path: 'reports/:id',
        loadComponent: () => import('./features/reports/report-details/report-details.component')
      },
      {
        path: 'users',
        loadComponent: () => import('./features/users/users.component')
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./features/users/user-details/user-details.component')
      },
      {
        path: 'definitions',
        loadComponent: () => import('./features/definitions/definitions.component')
      },
      {
        path: 'abuse-reports',
        loadComponent: () => import('./features/abuse-reports/abuse-reports.component')
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
