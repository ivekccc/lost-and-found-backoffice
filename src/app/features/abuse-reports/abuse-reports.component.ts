import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, filter, finalize, forkJoin, map, of, switchMap, tap } from 'rxjs';
import { AbuseReason, AbuseReportDto, AbuseReportStatus, AbuseTargetType } from '@lost-and-found/api';
import { AbuseReportsApiService } from '../../core/api/abuse-reports-api.service';
import { ConversationsApiService } from '../../core/api/conversations-api.service';
import { ConfirmModalService } from '../../shared/services/confirm-modal.service';
import { ModalService } from '../../shared/services/modal/modal.service';
import { ToastService } from '../../shared/services/toast.service';
import { QueueCountsService } from '../../core/layout/queue-counts.service';
import { ConversationModalComponent } from './conversation-modal/conversation-modal.component';
import { DataTableComponent, TableColumn, TableEmptyDirective, TableRowDirective } from '../../shared/components/data-table/data-table.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SegmentedComponent, SegmentOption } from '../../shared/components/segmented/segmented.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { ABUSE_REASON, ABUSE_STATUS, ABUSE_TARGET } from '../../shared/ui/status';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { ALL_VALUE, createListQuery } from '../../shared/data/list-query';
import { createPagedLoader } from '../../shared/data/paged-loader';

const FILTERS = ['status', 'targetType', 'reason', 'reportId', 'userId'] as const;

@Component({
  selector: 'app-abuse-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectComponent,
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
  templateUrl: './abuse-reports.component.html',
  styleUrl: './abuse-reports.component.scss',
})
export default class AbuseReportsComponent {
  private readonly abuseReportsApi = inject(AbuseReportsApiService);
  private readonly conversationsApi = inject(ConversationsApiService);
  private readonly confirmModalService = inject(ConfirmModalService);
  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);
  protected readonly queueCounts = inject(QueueCountsService);

  protected readonly query = createListQuery({
    filters: FILTERS,
    defaultSort: 'createdAt',
    defaultDirection: 'desc',
    defaultFilters: { status: AbuseReportStatus.PENDING },
  });
  protected readonly loader = createPagedLoader(this.query.state, (state) =>
    this.abuseReportsApi.getReports({
      page: state.page,
      size: state.size,
      sort: state.sort,
      direction: state.direction,
      status: state.filters.status as AbuseReportStatus | undefined,
      targetType: state.filters.targetType as AbuseTargetType | undefined,
      reason: state.filters.reason as AbuseReason | undefined,
      reportId: state.filters.reportId ? Number(state.filters.reportId) : undefined,
      userId: state.filters.userId ? Number(state.filters.userId) : undefined,
    }),
  );

  protected readonly selected = signal<ReadonlySet<number>>(new Set());
  protected readonly working = signal(false);
  protected readonly openingConversation = signal<number | null>(null);
  protected readonly abuseStatus = ABUSE_STATUS;
  protected readonly reasonLabel = ABUSE_REASON;
  protected readonly targetLabel = ABUSE_TARGET;
  protected readonly targetTypes = AbuseTargetType;
  protected readonly pendingStatus = AbuseReportStatus.PENDING;
  protected readonly reasonOptions = Object.entries(ABUSE_REASON).map(([value, label]) => ({ value, label }));
  protected readonly targetOptions = Object.entries(ABUSE_TARGET).map(([value, label]) => ({ value, label }));
  protected readonly isPendingView = computed(() => this.query.state().filters.status === AbuseReportStatus.PENDING);
  protected readonly statusSegments = computed<SegmentOption[]>(() => [
    { value: AbuseReportStatus.PENDING, label: 'Pending', count: this.queueCounts.current()?.pendingAbuseReports },
    { value: AbuseReportStatus.REVIEWED_ACTIONED, label: 'Actioned' },
    { value: AbuseReportStatus.DISMISSED, label: 'Dismissed' },
    { value: ALL_VALUE, label: 'All' },
  ]);
  protected readonly activeSegment = computed(() => this.query.state().filters.status ?? ALL_VALUE);
  protected readonly columns = computed<TableColumn[]>(() => [
    { key: 'target', label: 'Reported' },
    { key: 'reason', label: 'Reason', sortKey: 'reason', width: '160px' },
    { key: 'reporter', label: 'Reported by', width: '170px' },
    { key: 'createdAt', label: 'Filed', sortKey: 'createdAt', width: '120px' },
    { key: 'status', label: 'Status', sortKey: 'status', width: '110px' },
    { key: 'actions', label: 'Actions', hideLabel: true, width: '96px', align: 'end' },
  ]);

  constructor() {
    effect(() => {
      this.query.state();
      untracked(() => this.clearSelection());
    });
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  protected setStatus(value: string): void {
    this.clearSelection();
    this.query.setFilter('status', value === ALL_VALUE ? null : value);
  }

  protected dismiss(report: AbuseReportDto): void {
    this.confirmDismiss(1, `“${report.targetLabel}” stays as it is and the reporter's complaint is closed.`)
      .pipe(
        switchMap(() => this.abuseReportsApi.dismiss(report.id)),
        tap(() => this.afterDismiss(1)),
        catchError(() => EMPTY),
      )
      .subscribe();
  }

  protected dismissSelected(): void {
    const ids = [...this.selected()];
    this.confirmDismiss(ids.length, 'The reported items stay as they are and the complaints are closed.')
      .pipe(
        tap(() => this.working.set(true)),
        switchMap(() =>
          forkJoin(ids.map((id) => this.abuseReportsApi.dismiss(id).pipe(map(() => true), catchError(() => of(false))))),
        ),
        tap((results) => {
          const done = results.filter(Boolean).length;
          const failed = results.length - done;
          if (done > 0) {
            this.afterDismiss(done);
          }
          if (failed > 0) {
            this.toastService.error(`${failed} of ${results.length} reports could not be dismissed`, { detail: 'They are still in the queue. Try again.' });
          }
        }),
        finalize(() => this.working.set(false)),
      )
      .subscribe();
  }

  protected openConversation(report: AbuseReportDto): void {
    if (this.openingConversation() !== null || report.targetConversationId == null) {
      return;
    }
    this.openingConversation.set(report.id);
    this.conversationsApi
      .getConversation(report.targetConversationId)
      .pipe(
        finalize(() => this.openingConversation.set(null)),
        tap((conversation) =>
          this.modalService.openCentralModal(ConversationModalComponent, {
            initialState: { data: conversation, highlightedMessageId: report.targetMessageId },
          }),
        ),
        catchError(() => {
          this.toastService.error('Could not open the conversation');
          return EMPTY;
        }),
      )
      .subscribe();
  }

  private confirmDismiss(count: number, consequence: string) {
    return this.confirmModalService
      .openConfirm(consequence, {
        title: count === 1 ? 'Dismiss this report?' : `Dismiss ${count} reports?`,
        confirmText: count === 1 ? 'Dismiss report' : `Dismiss ${count} reports`,
      })
      .pipe(filter((confirmed) => confirmed));
  }

  private afterDismiss(count: number): void {
    this.toastService.success(count === 1 ? 'Report dismissed' : `${count} reports dismissed`);
    this.clearSelection();
    this.loader.reload();
    this.queueCounts.refresh(true);
  }
}
