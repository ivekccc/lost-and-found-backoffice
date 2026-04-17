import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ReportDetailsDto } from '@lost-and-found/api';
import { tap, catchError, EMPTY } from 'rxjs';
import { ReportsApiService } from '../../../core/api/reports-api.service';
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

  report = signal<ReportDetailsDto | null>(null);
  loading = signal(true);
  error = signal(false);

  ngOnInit(): void {
    this._loadReport();
  }

  retryLoad(): void {
    this._loadReport();
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
