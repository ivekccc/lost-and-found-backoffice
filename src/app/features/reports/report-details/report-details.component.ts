import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { map, tap } from 'rxjs';
import { AdminReportDetailsDto, AuditTargetType, ReportStatus } from '@lost-and-found/api';
import { ReportsApiService } from '../../../core/api/reports-api.service';
import { ClaimsApiService } from '../../../core/api/claims-api.service';
import { QueueCountsService } from '../../../core/layout/queue-counts.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { MapViewComponent } from '../../../shared/components/map-view/map-view.component';
import { ImageGalleryComponent } from '../../../shared/components/image-gallery/image-gallery.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { CLAIM_STATUS, REPORT_STATUS, REPORT_TYPE } from '../../../shared/ui/status';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { createResourceLoader, routeId$ } from '../../../shared/data/resource-loader';
import { createPagedLoader } from '../../../shared/data/paged-loader';
import { whenPresent } from '../../../shared/data/empty-page';
import { ModerationActionService, ModerationAction } from '../../../shared/services/moderation-action.service';
import { ModerationHistoryComponent } from '../../../shared/components/moderation-history/moderation-history.component';
import { ComplaintsPanelComponent } from '../../../shared/components/complaints-panel/complaints-panel.component';
import { PanelStateComponent } from '../../../shared/components/panel-state/panel-state.component';
import { describeHttpError } from '../../../core/utils/http-error';

@Component({
  selector: 'app-report-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    ErrorStateComponent,
    MapViewComponent,
    ImageGalleryComponent,
    StatusBadgeComponent,
    RelativeTimePipe,
    DatePipe,
    DecimalPipe,
    RouterLink,
    CdkMenuTrigger,
    CdkMenu,
    CdkMenuItem,
    ModerationHistoryComponent,
    ComplaintsPanelComponent,
    PanelStateComponent,
  ],
  templateUrl: './report-details.component.html',
})
export default class ReportDetailsComponent {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly claimsApi = inject(ClaimsApiService);
  private readonly queueCounts = inject(QueueCountsService);
  private readonly toastService = inject(ToastService);

  private readonly reportId = toSignal(routeId$(inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id')))), {
    initialValue: null,
  });
  protected readonly report = createResourceLoader(this.reportId, (id) => this.reportsApi.getReportById(id));
  protected readonly claims = createPagedLoader(this.reportId, whenPresent((id: number) => this.claimsApi.getClaims({ reportId: id, size: 10 })));
  private readonly complaints = viewChild(ComplaintsPanelComponent);
  private readonly history = viewChild(ModerationHistoryComponent);
  protected readonly moderation = inject(ModerationActionService);
  protected readonly id = this.reportId;
  protected readonly auditTarget = AuditTargetType.REPORT;
  protected readonly statuses = ReportStatus;
  protected readonly loadError = computed(() => (this.report.error() ? describeHttpError(this.report.error()) : null));
  protected readonly isHidden = computed(() => this.report.value()?.status === ReportStatus.FLAGGED);
  protected readonly reportStatus = REPORT_STATUS;
  protected readonly reportType = REPORT_TYPE;
  protected readonly claimStatus = CLAIM_STATUS;

  protected hide(report: AdminReportDetailsDto): void {
    this.runAndRefresh({
      title: 'Hide this report?',
      message: 'It disappears from search, the map and matching, and the owner sees it as hidden. Pending complaints about it are closed as actioned.',
      confirmText: 'Hide report',
      destructive: true,
      run: () => this.reportsApi.flagReport(report.id),
      doneMessage: 'Report hidden',
    });
  }

  protected restore(report: AdminReportDetailsDto): void {
    this.runAndRefresh({
      title: 'Restore this report?',
      message: 'It returns to the status it had before it was hidden.',
      confirmText: 'Restore report',
      run: () => this.reportsApi.unflagReport(report.id),
      doneMessage: 'Report restored',
    });
  }

  protected copyLink(): void {
    navigator.clipboard
      .writeText(window.location.href)
      .then(() => this.toastService.info('Link copied'))
      .catch(() => this.toastService.error('Could not copy to the clipboard'));
  }

  private runAndRefresh(action: ModerationAction): void {
    this.moderation
      .confirm(action)
      .pipe(
        tap(() => {
          this.report.reload();
          this.complaints()?.reload();
          this.history()?.reload();
          this.queueCounts.refresh(true);
        }),
      )
      .subscribe();
  }
}
