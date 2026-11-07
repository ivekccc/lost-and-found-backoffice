import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AbuseReason, AbuseReportStatus, AbuseTargetType, PageAbuseReportDto } from '@lost-and-found/api';
import { ApiService } from './api.service';
import { PageQueryParams, toHttpParams } from './query-params';

export interface AbuseReportQuery extends PageQueryParams {
  status?: AbuseReportStatus;
  targetType?: AbuseTargetType;
  reason?: AbuseReason;
  reportId?: number;
  userId?: number;
}

@Injectable({ providedIn: 'root' })
export class AbuseReportsApiService {
  private readonly api = inject(ApiService);

  getReports(query: AbuseReportQuery): Observable<PageAbuseReportDto> {
    return this.api.get<PageAbuseReportDto>('admin/abuse-reports', toHttpParams(query));
  }

  dismiss(id: number): Observable<void> {
    return this.api.post<void>(`admin/abuse-reports/${id}/dismiss`, {});
  }
}
