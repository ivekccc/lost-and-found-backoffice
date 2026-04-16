import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReportListDto } from '@lost-and-found/api';
import { tap, catchError, EMPTY } from 'rxjs';
import { ReportsApiService } from '../../core/api/reports-api.service';
import {
  DataTableComponent,
  DataTableHeaderTemplateDirective,
  DataTableRowTemplateDirective,
} from '../../shared/components/data-table/data-table.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataTableComponent,
    DataTableHeaderTemplateDirective,
    DataTableRowTemplateDirective,
    DatePipe,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export default class ReportsComponent implements OnInit {
  private reportsApi = inject(ReportsApiService);

  reports = signal<ReportListDto[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.reportsApi.getReports().pipe(
      tap((reports) => {
        this.reports.set(reports);
        this.loading.set(false);
      }),
      catchError(() => {
        this.loading.set(false);
        return EMPTY;
      }),
    ).subscribe();
  }
}
