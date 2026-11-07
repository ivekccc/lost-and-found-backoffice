import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  UserDetailsDto,
  PageUserListDto,
  UserProfileDto,
  UserRole,
  UserStatus,
} from '@lost-and-found/api';
import { ApiService } from './api.service';
import { PageQueryParams, toHttpParams } from './query-params';

export interface AdminUserQuery extends PageQueryParams {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class UserApiService {
  constructor(private api: ApiService) {}

  getProfile(): Observable<UserProfileDto> {
    return this.api.get<UserProfileDto>('users/me');
  }

  getUsers(query: AdminUserQuery): Observable<PageUserListDto> {
    return this.api.get<PageUserListDto>('admin/users', toHttpParams(query));
  }

  getUserById(id: number): Observable<UserDetailsDto> {
    return this.api.get<UserDetailsDto>(`admin/users/${id}`);
  }

  deleteUser(id: number): Observable<void> {
    return this.api.delete<void>(`admin/users/${id}`);
  }

  blockUser(id: number): Observable<void> {
    return this.api.post<void>(`admin/users/${id}/block`, {});
  }

  partialBlockUser(id: number): Observable<void> {
    return this.api.post<void>(`admin/users/${id}/partial-block`, {});
  }

  revokeSessions(id: number): Observable<void> {
    return this.api.post<void>(`admin/users/${id}/sessions/revoke`, {});
  }

  unblockUser(id: number): Observable<void> {
    return this.api.post<void>(`admin/users/${id}/unblock`, {});
  }
}
