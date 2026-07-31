import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminReportListDto } from '@lost-and-found/api';
import { mapReportDetailsToListItem } from './reports.utils';
import { tap, catchError, EMPTY } from 'rxjs';
import { ReportsApiService } from '../../core/api/reports-api.service';
import { ModalService } from '../../shared/services/modal/modal.service';
import { AddReportComponent } from './add-report/add-report.component';
import {
  DataTableComponent,
  DataTableHeaderTemplateDirective,
  DataTableRowTemplateDirective,
} from '../../shared/components/data-table/data-table.component';
import { DataTableSkeletonComponent } from '../../shared/components/data-table-skeleton/data-table-skeleton.component';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataTableComponent,
    DataTableHeaderTemplateDirective,
    DataTableRowTemplateDirective,
    DataTableSkeletonComponent,
    DatePipe,
    RouterLink,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export default class ReportsComponent implements OnInit {
  private reportsApi = inject(ReportsApiService);
  private modalService = inject(ModalService);
  private destroyRef = inject(DestroyRef);

  reports = signal<AdminReportListDto[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this._loadReports();
  }

  reloadReports(): void {
    this._loadReports();
  }

  addNewReport(): void {
    const modalRef = this.modalService.openRightModal(AddReportComponent);
    const addReportComponent = modalRef.content as AddReportComponent;

    addReportComponent.onAdd
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((report) => {
        modalRef.hide();
        this.reports.update((reports) => [mapReportDetailsToListItem(report), ...reports]);
      });
  }

  private _loadReports(): void {
    this.loading.set(true);
    this.reportsApi
      .getReports()
      .pipe(
        tap((reports) => {
          this.reports.set(reports);
          this.loading.set(false);
        }),
        catchError(() => {
          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
