import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PageAdminMatchListDto, ReportMatchStatus } from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class MatchesApiService {
  constructor(private api: ApiService) {}

  getMatches(options: {
    page: number;
    size: number;
    status?: ReportMatchStatus;
    minScore?: number;
  }): Observable<PageAdminMatchListDto> {
    let params = new HttpParams()
      .append('page', options.page)
      .append('size', options.size);
    if (options.status) {
      params = params.append('status', options.status);
    }
    if (options.minScore != null) {
      params = params.append('minScore', options.minScore);
    }
    return this.api.get<PageAdminMatchListDto>('admin/matches', params);
  }
}
