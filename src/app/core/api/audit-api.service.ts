import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuditAction, AuditTargetType, PageAuditEntryDto } from '@lost-and-found/api';
import { ApiService } from './api.service';
import { PageQueryParams, toHttpParams } from './query-params';

export interface AuditQuery extends PageQueryParams {
  action?: AuditAction;
  targetType?: AuditTargetType;
  targetId?: number;
  actorId?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly api = inject(ApiService);

  getEntries(query: AuditQuery): Observable<PageAuditEntryDto> {
    return this.api.get<PageAuditEntryDto>('admin/audit-log', toHttpParams(query));
  }
}
