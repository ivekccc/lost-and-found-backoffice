import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminReportDetailsDto,
  CreateReportRequest,
  ReportDetailsDto,
  ReportListDto,
  ReportType,
} from '@lost-and-found/api';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  constructor(private api: ApiService) {}

  getReports(type?: ReportType): Observable<ReportListDto[]> {
    let params = new HttpParams();
    if (type) {
      params = params.append('type', type);
    }
    return this.api.get<ReportListDto[]>('reports', params);
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
