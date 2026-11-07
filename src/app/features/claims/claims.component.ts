import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ClaimStatus } from '@lost-and-found/api';
import { ClaimsApiService } from '../../core/api/claims-api.service';
import { QueueCountsService } from '../../core/layout/queue-counts.service';
import { DataTableComponent, TableColumn, TableEmptyDirective, TableRowDirective } from '../../shared/components/data-table/data-table.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SegmentedComponent, SegmentOption } from '../../shared/components/segmented/segmented.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { CLAIM_STATUS, REPORT_TYPE } from '../../shared/ui/status';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { ALL_VALUE, createListQuery } from '../../shared/data/list-query';
import { createPagedLoader } from '../../shared/data/paged-loader';

@Component({
  selector: 'app-claims',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataTableComponent,
    TableRowDirective,
    TableEmptyDirective,
    PageHeaderComponent,
    SegmentedComponent,
    StatusBadgeComponent,
    RelativeTimePipe,
    DatePipe,
    RouterLink,
  ],
  templateUrl: './claims.component.html',
})
export default class ClaimsComponent {
  private readonly claimsApi = inject(ClaimsApiService);
  private readonly queueCounts = inject(QueueCountsService);

  protected readonly query = createListQuery({ filters: ['status'] as const, defaultSort: 'submittedAt', defaultDirection: 'desc' });
  protected readonly loader = createPagedLoader(this.query.state, (state) =>
    this.claimsApi.getClaims({
      page: state.page,
      size: state.size,
      sort: state.sort,
      direction: state.direction,
      status: state.filters.status as ClaimStatus | undefined,
    }),
  );

  protected readonly claimStatus = CLAIM_STATUS;
  protected readonly reportType = REPORT_TYPE;
  protected readonly activeSegment = computed(() => this.query.state().filters.status ?? ALL_VALUE);
  protected readonly segments = computed<SegmentOption[]>(() => [
    { value: ALL_VALUE, label: 'All' },
    { value: ClaimStatus.PENDING, label: 'Pending', count: this.queueCounts.current()?.pendingClaims },
    { value: ClaimStatus.APPROVED, label: 'Approved' },
    { value: ClaimStatus.DECLINED, label: 'Declined' },
    { value: ClaimStatus.WITHDRAWN, label: 'Withdrawn' },
  ]);
  protected readonly columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortKey: 'id', width: '72px' },
    { key: 'report', label: 'Report' },
    { key: 'claimant', label: 'Claimed by', width: '180px' },
    { key: 'author', label: 'Questions by', width: '180px' },
    { key: 'status', label: 'Status', sortKey: 'status', width: '120px' },
    { key: 'submittedAt', label: 'Submitted', sortKey: 'submittedAt', width: '130px' },
    { key: 'decidedAt', label: 'Decided', width: '130px' },
  ];

  protected setStatus(value: string): void {
    this.query.setFilter('status', value === ALL_VALUE ? null : value);
  }
}
