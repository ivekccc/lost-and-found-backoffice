import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, Observable, of, throwError, EMPTY } from 'rxjs';
import { tap, switchMap, filter, take, catchError } from 'rxjs/operators';
import { AuthRequestDto, UserRole } from '@lost-and-found/api';
import { AuthApiService } from '../api/auth-api.service';
import { UserApiService } from '../api/user-api.service';
import { AppStore } from '../../app.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly ROLE_KEY = 'user_role';

  private _isAuthenticated = signal(this.hasToken());
  isAuthenticated = this._isAuthenticated.asReadonly();

  private isRefreshing = false;
  private refreshSubject$ = new Subject<string>();

  constructor(
    private authApi: AuthApiService,
    private userApi: UserApiService,
    private appStore: AppStore,
    private router: Router,
  ) {}

  login(data: AuthRequestDto) {
    return this.authApi.login(data).pipe(
      tap((response) => {
        if (response.role !== UserRole.ADMIN) {
          throw new Error('Access denied. Admin role required.');
        }
        this.setTokens(response.accessToken, response.refreshToken, response.role);
      }),
      switchMap(() => this.userApi.getProfile()),
      tap((user) => this.appStore.setState({ user })),
    );
  }

  refreshToken(): Observable<string> {
    if (this.isRefreshing) {
      return this.refreshSubject$.pipe(
        filter((token) => token !== ''),
        take(1),
      );
    }

    this.isRefreshing = true;
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN_KEY);

    if (!refreshToken) {
      this.handleRefreshFailure();
      return throwError(() => new Error('No refresh token'));
    }

    return this.authApi.refresh({ refreshToken }).pipe(
      tap((response) => {
        localStorage.setItem(this.TOKEN_KEY, response.accessToken);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);
        this.isRefreshing = false;
        this.refreshSubject$.next(response.accessToken);
      }),
      switchMap((response) => of(response.accessToken)),
    );
  }

  handleRefreshFailure() {
    this.isRefreshing = false;
    this.refreshSubject$.next('');
    this.clearSession();
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

  private clearSession() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.ROLE_KEY);
    this._isAuthenticated.set(false);
    this.appStore.setState({ user: null });
    this.router.navigate(['/login']);
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
    this._isAuthenticated.set(true);
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
