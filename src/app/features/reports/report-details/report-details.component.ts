import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AdminReportDetailsDto } from '@lost-and-found/api';
import { tap, catchError, EMPTY, Observable } from 'rxjs';
import { ReportsApiService } from '../../../core/api/reports-api.service';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';
import { DetailsSkeletonComponent } from '../../../shared/components/details-skeleton/details-skeleton.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { MapViewComponent } from '../../../shared/components/map-view/map-view.component';
import { ImageGalleryComponent } from '../../../shared/components/image-gallery/image-gallery.component';

@Component({
  selector: 'app-report-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    DetailsSkeletonComponent,
    ErrorStateComponent,
    MapViewComponent,
    ImageGalleryComponent,
  ],
  templateUrl: './report-details.component.html',
  styleUrl: './report-details.component.scss',
})
export default class ReportDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private reportsApi = inject(ReportsApiService);
  private confirmModalService = inject(ConfirmModalService);
  private destroyRef = inject(DestroyRef);

  report = signal<AdminReportDetailsDto | null>(null);
  loading = signal(true);
  error = signal(false);
  linkCopied = signal(false);
  moderating = signal(false);

  ngOnInit(): void {
    this._loadReport();
  }

  flagReport(): void {
    const report = this.report();
    if (!report) {
      return;
    }
    this.confirmModalService
      .openConfirm(
        `Flag "${report.title}"? It will be hidden from public lists.`,
        { title: 'Flag listing', confirmText: 'Flag', destructive: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this._moderate(this.reportsApi.flagReport(report.id));
        }
      });
  }

  unflagReport(): void {
    const report = this.report();
    if (report) {
      this._moderate(this.reportsApi.unflagReport(report.id));
    }
  }

  private _moderate(action: Observable<void>): void {
    this.moderating.set(true);
    action
      .pipe(
        tap(() => {
          this.moderating.set(false);
          this._loadReport();
        }),
        catchError(() => {
          this.moderating.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  retryLoad(): void {
    this._loadReport();
  }

  shareLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }

  private _loadReport(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    this.reportsApi
      .getReportById(id)
      .pipe(
        tap((report) => {
          this.report.set(report);
          this.loading.set(false);
        }),
        catchError(() => {
          this.error.set(true);
          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
