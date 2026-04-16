import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRequestDto, AuthResponseDto, RefreshTokenRequestDto, RefreshTokenResponseDto } from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  constructor(private api: ApiService) {}

  login(data: AuthRequestDto): Observable<AuthResponseDto> {
    return this.api.post<AuthResponseDto>('auth/login', data);
  }

  refresh(data: RefreshTokenRequestDto): Observable<RefreshTokenResponseDto> {
    return this.api.post<RefreshTokenResponseDto>('auth/refresh', data);
  }
}
