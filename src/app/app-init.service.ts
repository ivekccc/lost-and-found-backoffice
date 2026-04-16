import { Injectable } from '@angular/core';
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
      catchError(() => {
        this.authService.logout();
        return of(void 0);
      }),
    );
  }
}
