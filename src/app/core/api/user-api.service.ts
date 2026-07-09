import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import {
  UserDetailsDto,
  UserListDto,
  UserProfileDto,
  UserRole,
} from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  constructor(private api: ApiService) {}

  getProfile(): Observable<UserProfileDto> {
    return this.api.get<UserProfileDto>('users/me');
  }

  getAllUsers(role?: UserRole): Observable<UserListDto[]> {
    let params = new HttpParams();
    if (role) {
      params = params.append('role', role);
    }
    return this.api.get<UserListDto[]>('admin/users', params);
  }

  getUserById(id: number): Observable<UserDetailsDto> {
    return this.api.get<UserDetailsDto>(`admin/users/${id}`);
  }

  deleteUser(id: number): Observable<void> {
    return this.api.delete<void>(`admin/users/${id}`);
  }
}
