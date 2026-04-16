import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { UserProfileDto } from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  constructor(private api: ApiService) {}

  getProfile(): Observable<UserProfileDto> {
    return this.api.get<UserProfileDto>('users/me');
  }
}
