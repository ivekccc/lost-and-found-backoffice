import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminReportDetailsDto,
  PageAdminReportListDto,
  CreateReportRequest,
  ReportDetailsDto,
  ReportStatus,
  ReportType,
} from '@lost-and-found/api';
import { ApiService } from './api.service';
import { PageQueryParams, toHttpParams } from './query-params';

export interface AdminReportQuery extends PageQueryParams {
  type?: ReportType;
  status?: ReportStatus;
  cityId?: number;
  ownerId?: number;
  search?: string;
}

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  constructor(private api: ApiService) {}

  getReports(query: AdminReportQuery): Observable<PageAdminReportListDto> {
    return this.api.get<PageAdminReportListDto>('admin/reports', toHttpParams(query));
  }

  getReportById(id: number): Observable<AdminReportDetailsDto> {
    return this.api.get<AdminReportDetailsDto>(`admin/reports/${id}`);
  }

  createReport(data: CreateReportRequest): Observable<ReportDetailsDto> {
    return this.api.post<ReportDetailsDto>('reports', data);
  }

  flagReport(id: number): Observable<void> {
    return this.api.post<void>(`admin/reports/${id}/flag`, {});
  }

  unflagReport(id: number): Observable<void> {
    return this.api.post<void>(`admin/reports/${id}/unflag`, {});
  }
}
