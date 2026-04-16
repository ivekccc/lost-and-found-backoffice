import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportCategoryDto } from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportCategoriesApiService {
  constructor(private api: ApiService) {}

  getAll(): Observable<ReportCategoryDto[]> {
    return this.api.get<ReportCategoryDto[]>('report-categories');
  }
}
