import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { AuditTargetType, ClaimStatus, ReportStatus } from '@lost-and-found/api';
import { DashboardApiService } from '../../core/api/dashboard-api.service';
import { AuditApiService } from '../../core/api/audit-api.service';
import { QueueCountsService } from '../../core/layout/queue-counts.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SegmentedComponent, SegmentOption } from '../../shared/components/segmented/segmented.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { createPagedLoader } from '../../shared/data/paged-loader';
import { describeHttpError } from '../../core/utils/http-error';
import { ActivityChartComponent } from './activity-chart/activity-chart.component';
import { PanelStateComponent } from '../../shared/components/panel-state/panel-state.component';
import { auditTargetLink } from '../audit-log/audit-presentation';

const RANGES: SegmentOption[] = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
];

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, SegmentedComponent, ErrorStateComponent, ActivityChartComponent, PanelStateComponent, RelativeTimePipe, DatePipe, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export default class DashboardComponent {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly auditApi = inject(AuditApiService);
  protected readonly queueCounts = inject(QueueCountsService);

  protected readonly ranges = RANGES;
  protected readonly range = signal(30);
  protected readonly activity = createPagedLoader(this.range, (days) =>
    this.dashboardApi.getActivity(days).pipe(map((content) => ({ content, totalElements: content.length }))),
  );
  protected readonly cities = createPagedLoader(this.range, (days) =>
    this.dashboardApi.getCities(days).pipe(map((content) => ({ content, totalElements: content.length }))),
  );
  private readonly auditTrigger = signal(0);
  protected readonly recent = createPagedLoader(this.auditTrigger, () => this.auditApi.getEntries({ size: 8 }));

  protected readonly totals = computed(() =>
    this.activity.rows().reduce(
      (sum, day) => ({
        posted: sum.posted + day.reportsPosted,
        reunited: sum.reunited + day.reportsReunited,
        users: sum.users + day.usersRegistered,
      }),
      { posted: 0, reunited: 0, users: 0 },
    ),
  );
  protected readonly activityError = computed(() => (this.activity.error() ? describeHttpError(this.activity.error()) : null));
  protected readonly targetTypes = AuditTargetType;
  protected readonly pendingClaims = { status: ClaimStatus.PENDING };
  protected readonly flaggedReports = { status: ReportStatus.FLAGGED };
  protected readonly targetLink = auditTargetLink;

  constructor() {
    this.queueCounts.refresh(true);
  }

  protected setRange(value: string): void {
    this.range.set(Number(value));
  }
}
