import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AdminReportDetailsDto,
  AdminReportListDto,
  CreateReportRequest,
  ReportDetailsDto,
  ReportStatus,
  ReportType,
} from '@lost-and-found/api';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  constructor(private api: ApiService) {}

  // Moderacija ide kroz admin/reports, ne kroz javni /reports: javni endpoint vraca
  // samo ACTIVE oglase, izbacuje sopstvene i maskira lokaciju na nivo zone.
  getReports(type?: ReportType, status?: ReportStatus, cityId?: number): Observable<AdminReportListDto[]> {
    let params = new HttpParams();
    if (type) {
      params = params.append('type', type);
    }
    if (cityId) {
      params = params.append('cityId', cityId);
    }
    if (status) {
      params = params.append('status', status);
    }
    return this.api.get<AdminReportListDto[]>('admin/reports', params);
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
