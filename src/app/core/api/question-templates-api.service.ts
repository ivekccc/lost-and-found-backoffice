import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AdminQuestionTemplateDto,
  CreateQuestionTemplateRequestDto,
  UpdateQuestionTemplateRequestDto,
} from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class QuestionTemplatesApiService {
  constructor(private api: ApiService) {}

  getTemplates(categoryId?: number): Observable<AdminQuestionTemplateDto[]> {
    let params = new HttpParams();
    if (categoryId != null) {
      params = params.set('categoryId', categoryId);
    }
    return this.api.get<AdminQuestionTemplateDto[]>('admin/question-templates', params);
  }

  create(data: CreateQuestionTemplateRequestDto): Observable<AdminQuestionTemplateDto> {
    return this.api.post<AdminQuestionTemplateDto>('admin/question-templates', data);
  }

  update(id: number, data: UpdateQuestionTemplateRequestDto): Observable<AdminQuestionTemplateDto> {
    return this.api.put<AdminQuestionTemplateDto>(`admin/question-templates/${id}`, data);
  }

  deactivate(id: number): Observable<void> {
    return this.api.delete<void>(`admin/question-templates/${id}`);
  }
}
