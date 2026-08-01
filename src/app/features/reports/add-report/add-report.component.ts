import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { AsyncPipe, NgClass } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { Observable, Subject, of } from 'rxjs';
import { tap, catchError, debounceTime, distinctUntilChanged, switchMap, EMPTY } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {
  AutoCompleteSuggestionDto,
  ReportType,
  ReportDetailsDto,
  ReportCategoryDto,
  CreateReportRequest,
} from '@lost-and-found/api';
import { ReportsApiService } from '../../../core/api/reports-api.service';
import { ReportCategoriesApiService } from '../../../core/api/report-categories-api.service';
import { LocationsApiService } from '../../../core/api/locations-api.service';
import { ConfirmButtonsComponent } from '../../../shared/components/confirm-buttons/confirm-buttons.component';

const AUTOCOMPLETE_DEBOUNCE_MS = 400;
const AUTOCOMPLETE_MIN_LENGTH = 2;

@Component({
  selector: 'app-add-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AsyncPipe, NgClass, NgSelectModule, ConfirmButtonsComponent],
  templateUrl: './add-report.component.html',
  styleUrl: './add-report.component.scss',
})
export class AddReportComponent implements OnInit {
  private reportsApi = inject(ReportsApiService);
  private categoriesApi = inject(ReportCategoriesApiService);
  private locationsApi = inject(LocationsApiService);

  onAdd: Subject<ReportDetailsDto> = new Subject();

  categories = signal<ReportCategoryDto[]>([]);

  // Lokacija je obavezna otkad postoji vise gradova: bez nje oglas nema zonu pa ni grad,
  // ne ulazi u pretragu ni u matching, i server ga odbija sa 400.
  reportForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    type: new FormControl<ReportType | null>(null, [Validators.required]),
    categoryId: new FormControl<number | null>(null, [Validators.required]),
    location: new FormControl<AutoCompleteSuggestionDto | null>(null, [Validators.required]),
  });

  locationSearch$ = new Subject<string>();
  locationSuggestions$: Observable<AutoCompleteSuggestionDto[]> = this.locationSearch$.pipe(
    debounceTime(AUTOCOMPLETE_DEBOUNCE_MS),
    distinctUntilChanged(),
    // switchMap, ne mergeMap: sporiji raniji odgovor ne sme da prepise noviji i vrati
    // predloge za vec obrisan upit.
    switchMap((query) =>
      !query || query.length < AUTOCOMPLETE_MIN_LENGTH
        ? of([])
        : this.locationsApi.autocomplete(query).pipe(catchError(() => of([]))),
    ),
  );

  reportTypeOptions = [
    { label: 'Lost', value: ReportType.LOST },
    { label: 'Found', value: ReportType.FOUND },
  ];

  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit(): void {
    this.categoriesApi.getAll().pipe(
      tap((categories) => this.categories.set(categories)),
    ).subscribe();
  }

  submit(): void {
    if (this.reportForm.invalid) {
      this.reportForm.markAllAsTouched();
      return;
    }

    this.reportForm.disable();

    const selectedLocation = this.reportForm.controls.location.value!;
    const createReportRequest: CreateReportRequest = {
      title: this.reportForm.controls.title.value!,
      description: this.reportForm.controls.description.value || undefined,
      type: this.reportForm.controls.type.value as ReportType,
      categoryId: this.reportForm.controls.categoryId.value!,
      location: {
        osmId: selectedLocation.osmId,
        osmType: selectedLocation.osmType,
      },
    };

    this.reportsApi.createReport(createReportRequest).pipe(
      tap((report) => this.onAdd.next(report)),
      catchError(() => {
        this.reportForm.enable();
        return EMPTY;
      }),
    ).subscribe();
  }
}
