import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminReportListDto, CityDto } from '@lost-and-found/api';
import { mapReportDetailsToListItem } from './reports.utils';
import { tap, catchError, switchMap, EMPTY, Subject } from 'rxjs';
import { ReportsApiService } from '../../core/api/reports-api.service';
import { CitiesApiService } from '../../core/api/cities-api.service';
import { ModalService } from '../../shared/services/modal/modal.service';
import { AddReportComponent } from './add-report/add-report.component';
import {
  DataTableComponent,
  DataTableHeaderTemplateDirective,
  DataTableRowTemplateDirective,
} from '../../shared/components/data-table/data-table.component';
import { DataTableSkeletonComponent } from '../../shared/components/data-table-skeleton/data-table-skeleton.component';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
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
    FormsModule,
    NgSelectModule,
    RouterLink,
  ],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export default class ReportsComponent implements OnInit {
  private reportsApi = inject(ReportsApiService);
  private citiesApi = inject(CitiesApiService);
  private modalService = inject(ModalService);
  private destroyRef = inject(DestroyRef);

  // Ucitavanje ide kroz jedan tok sa switchMap-om, a ne direktnim pozivom po promeni filtera:
  // dve brze promene grada inace znace dva zahteva u letu, pa sporiji raniji odgovor stigne
  // posle novijeg i prepise listu podacima za grad koji vise nije izabran.
  private loadTrigger = new Subject<void>();

  reports = signal<AdminReportListDto[]>([]);
  cities = signal<CityDto[]>([]);
  selectedCityId = signal<number | null>(null);
  loading = signal(true);

  ngOnInit(): void {
    this.citiesApi
      .getCities()
      .pipe(
        tap((cities) => this.cities.set(cities)),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.loadTrigger
      .pipe(
        tap(() => this.loading.set(true)),
        switchMap(() =>
          this.reportsApi
            .getReports(undefined, undefined, this.selectedCityId() ?? undefined)
            .pipe(
              tap((reports) => {
                this.reports.set(reports);
                this.loading.set(false);
              }),
              catchError(() => {
                this.loading.set(false);
                return EMPTY;
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.loadTrigger.next();
  }

  // Admin nema sopstveni grad — bez izabranog vidi sve gradove odjednom, sto je i smisao
  // moderacije. Filter je pomoc pri pregledu, ne granica vidljivosti.
  onCityChange(cityId: number | null): void {
    this.selectedCityId.set(cityId ?? null);
    this.loadTrigger.next();
  }

  reloadReports(): void {
    this.loadTrigger.next();
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
}
