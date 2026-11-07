import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ClaimStatus, PageAdminClaimListDto } from '@lost-and-found/api';
import { ApiService } from './api.service';
import { PageQueryParams, toHttpParams } from './query-params';

export interface AdminClaimQuery extends PageQueryParams {
  status?: ClaimStatus;
  claimantId?: number;
  reportId?: number;
}

@Injectable({ providedIn: 'root' })
export class ClaimsApiService {
  private readonly api = inject(ApiService);

  getClaims(query: AdminClaimQuery): Observable<PageAdminClaimListDto> {
    return this.api.get<PageAdminClaimListDto>('admin/claims', toHttpParams(query));
  }
}
