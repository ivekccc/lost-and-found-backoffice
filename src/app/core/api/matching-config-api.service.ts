import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MatchingConfigDto, UpdateMatchingConfigRequest } from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class MatchingConfigApiService {
  constructor(private api: ApiService) {}

  get(): Observable<MatchingConfigDto> {
    return this.api.get<MatchingConfigDto>('admin/matching-config');
  }

  update(data: UpdateMatchingConfigRequest): Observable<MatchingConfigDto> {
    return this.api.put<MatchingConfigDto>('admin/matching-config', data);
  }
}
