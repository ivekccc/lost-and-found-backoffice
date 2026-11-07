import { Injectable, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of, throwError, EMPTY, defer, firstValueFrom } from 'rxjs';
import { tap, switchMap, catchError, finalize, shareReplay, timeout } from 'rxjs/operators';
import { AuthRequestDto, UserRole } from '@lost-and-found/api';
import { AuthApiService } from '../api/auth-api.service';
import { UserApiService } from '../api/user-api.service';
import { AppStore } from '../../app.store';

export const LAST_ACTIVITY_KEY = 'last_activity_at';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly ROLE_KEY = 'user_role';

  private _isAuthenticated = signal(this.hasToken());
  isAuthenticated = this._isAuthenticated.asReadonly();

  private readonly REFRESH_LOCK = 'lost-and-found-auth-refresh';
  private readonly SESSION_REJECTED_STATUSES = [400, 401, 403];
  private readonly REFRESH_TIMEOUT_MS = 15000;
  private refreshInFlight$: Observable<string> | null = null;

  constructor(
    private authApi: AuthApiService,
    private userApi: UserApiService,
    private appStore: AppStore,
    private router: Router,
  ) {
    window.addEventListener('storage', (event) => {
      if ((event.key === this.TOKEN_KEY || event.key === null) && !localStorage.getItem(this.TOKEN_KEY) && this._isAuthenticated()) {
        this.clearSession();
      }
    });
  }

  login(data: AuthRequestDto) {
    return this.authApi.login(data).pipe(
      switchMap((response) => {
        if (response.role !== UserRole.ADMIN) {
          return this.authApi.logout({ refreshToken: response.refreshToken }).pipe(
            catchError(() => of(null)),
            switchMap(() => throwError(() => new Error('This account does not have moderator access.'))),
          );
        }
        this.setTokens(response.accessToken, response.refreshToken, response.role);
        return of(response);
      }),
      switchMap(() => this.userApi.getProfile()),
      tap((user) => this.appStore.setState({ user })),
    );
  }

  refreshToken(rejectedToken: string): Observable<string> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = defer(() => this.withRefreshLock(() => this.rotateTokens(rejectedToken))).pipe(
        catchError((error: unknown) => {
          const current = localStorage.getItem(this.TOKEN_KEY);
          if (current && current !== rejectedToken) {
            return of(current);
          }
          if (error instanceof HttpErrorResponse && this.SESSION_REJECTED_STATUSES.includes(error.status)) {
            this.clearSession();
          }
          return throwError(() => error);
        }),
        finalize(() => (this.refreshInFlight$ = null)),
        shareReplay({ bufferSize: 1, refCount: false }),
      );
    }
    return this.refreshInFlight$;
  }

  private async withRefreshLock(task: () => Promise<string>): Promise<string> {
    if (typeof navigator !== 'undefined' && navigator.locks) {
      return navigator.locks.request(this.REFRESH_LOCK, task);
    }
    return task();
  }

  private async rotateTokens(rejectedToken: string): Promise<string> {
    const current = localStorage.getItem(this.TOKEN_KEY);
    if (current && current !== rejectedToken) {
      return current;
    }
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      throw new HttpErrorResponse({ status: 401, statusText: 'No refresh token' });
    }
    const response = await firstValueFrom(this.authApi.refresh({ refreshToken }).pipe(timeout(this.REFRESH_TIMEOUT_MS)));
    if (localStorage.getItem(this.REFRESH_TOKEN_KEY) !== refreshToken) {
      this.authApi.logout({ refreshToken: response.refreshToken }).pipe(catchError(() => EMPTY)).subscribe();
      throw new HttpErrorResponse({ status: 401, statusText: 'Session ended during refresh' });
    }
    localStorage.setItem(this.TOKEN_KEY, response.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
    return response.accessToken;
  }

  logout() {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);
    if (refreshToken) {
      this.authApi
        .logout({ refreshToken })
        .pipe(catchError(() => EMPTY))
        .subscribe();
    }
    this.clearSession();
  }

  private clearSession(navigate = true) {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    this._isAuthenticated.set(false);
    this.appStore.setState({ user: null });
    if (navigate) {
      this.router.navigate(['/login']);
    }
  }

  isAdminSession(): boolean {
    const token = this.getToken();
    if (!token) {
      return false;
    }
    if (this.getRole() !== UserRole.ADMIN) {
      this.clearSession(false);
      return false;
    }
    return true;
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }

  private setTokens(token: string, refreshToken: string, role: string) {
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(this.ROLE_KEY, role);
    localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    this._isAuthenticated.set(true);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
