import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ReportCategoryDto,
  UpdateCategoryImageRequestDto,
  UpdateMinQuestionsRequestDto,
} from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ReportCategoriesApiService {
  constructor(private api: ApiService) {}

  getAll(): Observable<ReportCategoryDto[]> {
    return this.api.get<ReportCategoryDto[]>('report-categories');
  }

  updateMinQuestions(id: number, data: UpdateMinQuestionsRequestDto): Observable<void> {
    return this.api.put<void>(`admin/report-categories/${id}/min-questions`, data);
  }

  updateImage(id: number, data: UpdateCategoryImageRequestDto): Observable<void> {
    return this.api.put<void>(`admin/report-categories/${id}/image`, data);
  }
}
