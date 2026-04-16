import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportListDto, ReportDetailsDto, ReportType } from '@lost-and-found/api';
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

  getReportById(id: number): Observable<ReportDetailsDto> {
    return this.api.get<ReportDetailsDto>(`reports/${id}`);
  }
}
