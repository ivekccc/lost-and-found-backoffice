import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AdminReportListDto, ReportStatus, ReportType } from '@lost-and-found/api';
import { ReportsApiService } from '../../core/api/reports-api.service';
import { CitiesApiService } from '../../core/api/cities-api.service';
import { ModalService } from '../../shared/services/modal/modal.service';
import { AddReportComponent } from './add-report/add-report.component';
import { DataTableComponent, TableColumn, TableEmptyDirective, TableRowDirective } from '../../shared/components/data-table/data-table.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { REPORT_STATUS, REPORT_TYPE, enumOptions } from '../../shared/ui/status';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { createListQuery } from '../../shared/data/list-query';
import { createPagedLoader } from '../../shared/data/paged-loader';
import { isInteractiveTarget } from '../../shared/utils/row-navigation';

const FILTERS = ['search', 'type', 'status', 'cityId', 'ownerId'] as const;

@Component({
  selector: 'app-reports',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectComponent,
    DataTableComponent,
    TableRowDirective,
    TableEmptyDirective,
    PageHeaderComponent,
    SearchInputComponent,
    StatusBadgeComponent,
    RelativeTimePipe,
    DatePipe,
    RouterLink,
  ],
  templateUrl: './reports.component.html',
})
export default class ReportsComponent {
  private readonly reportsApi = inject(ReportsApiService);
  private readonly modalService = inject(ModalService);
  private readonly router = inject(Router);

  protected readonly query = createListQuery({ filters: FILTERS, defaultSort: 'createdAt', defaultDirection: 'desc' });
  protected readonly loader = createPagedLoader(this.query.state, (state) =>
    this.reportsApi.getReports({
      page: state.page,
      size: state.size,
      sort: state.sort,
      direction: state.direction,
      search: state.filters.search,
      type: state.filters.type as ReportType | undefined,
      status: state.filters.status as ReportStatus | undefined,
      cityId: state.filters.cityId ? Number(state.filters.cityId) : undefined,
      ownerId: state.filters.ownerId ? Number(state.filters.ownerId) : undefined,
    }),
  );

  protected readonly cities = toSignal(inject(CitiesApiService).getCities().pipe(catchError(() => of([]))), { initialValue: [] });
  protected readonly cityOptions = computed(() => this.cities().map((city) => ({ value: String(city.id), label: city.name })));
  protected readonly typeOptions = enumOptions(REPORT_TYPE);
  protected readonly statusOptions = enumOptions(REPORT_STATUS).filter((option) => option.value !== ReportStatus.DELETED);
  protected readonly reportStatus = REPORT_STATUS;
  protected readonly reportType = REPORT_TYPE;
  protected readonly filtered = computed(() => this.query.activeFilterCount() > 0);

  protected readonly columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortKey: 'id', width: '72px' },
    { key: 'title', label: 'Title', sortKey: 'title' },
    { key: 'type', label: 'Type', sortKey: 'type', width: '90px' },
    { key: 'status', label: 'Status', sortKey: 'status', width: '110px' },
    { key: 'category', label: 'Category', width: '140px' },
    { key: 'city', label: 'City', width: '120px' },
    { key: 'owner', label: 'Owner', width: '180px' },
    { key: 'createdAt', label: 'Posted', sortKey: 'createdAt', width: '130px' },
  ];

  protected openRow(event: Event, report: AdminReportListDto): void {
    if (!isInteractiveTarget(event)) {
      this.router.navigate(['/reports', report.id]);
    }
  }

  protected addReport(): void {
    const modalRef = this.modalService.openRightModal(AddReportComponent);
    const component = modalRef.content as AddReportComponent;
    component.onAdd.subscribe(() => {
      modalRef.hide();
      this.loader.reload();
    });
  }
}
