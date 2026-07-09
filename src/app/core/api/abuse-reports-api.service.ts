import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AbuseReportDto, AbuseReportStatus } from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AbuseReportsApiService {
  constructor(private api: ApiService) {}

  getReports(status?: AbuseReportStatus): Observable<AbuseReportDto[]> {
    let params = new HttpParams();
    if (status) {
      params = params.append('status', status);
    }
    return this.api.get<AbuseReportDto[]>('admin/abuse-reports', params);
  }

  dismiss(id: number): Observable<void> {
    return this.api.post<void>(`admin/abuse-reports/${id}/dismiss`, {});
  }
}
