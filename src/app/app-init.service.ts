import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuthService } from './core/services/auth.service';
import { UserApiService } from './core/api/user-api.service';
import { AppStore } from './app.store';
import { UserProfileDto } from '@lost-and-found/api';

@Injectable({ providedIn: 'root' })
export class AppInitService {
  constructor(
    private authService: AuthService,
    private userApi: UserApiService,
    private appStore: AppStore,
  ) {}

  init(): Observable<UserProfileDto | undefined> {
    if (!this.authService.getToken()) {
      return of(void 0);
    }

    return this.userApi.getProfile().pipe(
      tap((user) => this.appStore.setState({ user })),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 401 || error.status === 403)) {
          this.authService.logout();
        }
        return of(void 0);
      }),
    );
  }
}
