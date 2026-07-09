import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  AbuseReportDto,
  AbuseReportStatus,
  AbuseTargetType,
} from '@lost-and-found/api';
import { tap, catchError, EMPTY } from 'rxjs';
import { AbuseReportsApiService } from '../../core/api/abuse-reports-api.service';
import { ConfirmModalService } from '../../shared/services/confirm-modal.service';
import {
  DataTableComponent,
  DataTableHeaderTemplateDirective,
  DataTableRowTemplateDirective,
} from '../../shared/components/data-table/data-table.component';
import { DataTableSkeletonComponent } from '../../shared/components/data-table-skeleton/data-table-skeleton.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

const REASON_LABELS: Record<string, string> = {
  SCAM: 'Scam or fraud',
  SPAM: 'Spam',
  OFFENSIVE: 'Offensive content',
  PERSONAL_INFO: 'Personal information',
  WRONG_CATEGORY: 'Wrong category',
  OTHER: 'Other',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  REVIEWED_ACTIONED: 'Actioned',
  DISMISSED: 'Dismissed',
};

@Component({
  selector: 'app-abuse-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    NgSelectModule,
    DataTableComponent,
    DataTableHeaderTemplateDirective,
    DataTableRowTemplateDirective,
    DataTableSkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: './abuse-reports.component.html',
  styleUrl: './abuse-reports.component.scss',
})
export default class AbuseReportsComponent implements OnInit {
  private abuseReportsApi = inject(AbuseReportsApiService);
  private confirmModalService = inject(ConfirmModalService);
  private destroyRef = inject(DestroyRef);

  reports = signal<AbuseReportDto[]>([]);
  loading = signal(true);
  error = signal(false);
  selectedStatus = signal<AbuseReportStatus | null>(AbuseReportStatus.PENDING);

  AbuseTargetType = AbuseTargetType;

  statusOptions = [
    { label: 'Pending', value: AbuseReportStatus.PENDING },
    { label: 'Actioned', value: AbuseReportStatus.REVIEWED_ACTIONED },
    { label: 'Dismissed', value: AbuseReportStatus.DISMISSED },
  ];

  ngOnInit(): void {
    this._load();
  }

  reload(): void {
    this._load();
  }

  onStatusChange(status: AbuseReportStatus | null): void {
    this.selectedStatus.set(status ?? null);
    this._load();
  }

  reasonLabel(reason: string): string {
    return REASON_LABELS[reason] ?? reason;
  }

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  dismiss(report: AbuseReportDto): void {
    this.confirmModalService
      .openConfirm(
        `Dismiss this report about "${report.targetLabel}"? No action will be taken against the target.`,
        { title: 'Dismiss report', confirmText: 'Dismiss' },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.abuseReportsApi
          .dismiss(report.id)
          .pipe(
            tap(() =>
              this.reports.update((reports) => reports.filter((r) => r.id !== report.id)),
            ),
            catchError(() => EMPTY),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe();
      });
  }

  private _load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.abuseReportsApi
      .getReports(this.selectedStatus() ?? undefined)
      .pipe(
        tap((reports) => {
          this.reports.set(reports);
          this.loading.set(false);
        }),
        catchError(() => {
          this.error.set(true);
          this.loading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
