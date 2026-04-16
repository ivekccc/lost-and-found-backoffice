import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject } from 'rxjs';
import { tap, catchError, EMPTY } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ReportType, ReportDetailsDto, ReportCategoryDto, CreateReportRequest } from '@lost-and-found/api';
import { ReportsApiService } from '../../../core/api/reports-api.service';
import { ReportCategoriesApiService } from '../../../core/api/report-categories-api.service';
import { ConfirmButtonsComponent } from '../../../shared/components/confirm-buttons/confirm-buttons.component';

@Component({
  selector: 'app-add-report',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgClass, NgSelectModule, ConfirmButtonsComponent],
  templateUrl: './add-report.component.html',
  styleUrl: './add-report.component.scss',
})
export class AddReportComponent implements OnInit {
  private reportsApi = inject(ReportsApiService);
  private categoriesApi = inject(ReportCategoriesApiService);

  onAdd: Subject<ReportDetailsDto> = new Subject();

  categories = signal<ReportCategoryDto[]>([]);

  reportForm = new FormGroup({
    title: new FormControl('', [Validators.required]),
    description: new FormControl(''),
    type: new FormControl<ReportType | null>(null, [Validators.required]),
    categoryId: new FormControl<number | null>(null, [Validators.required]),
  });

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

    const createReportRequest: CreateReportRequest = {
      title: this.reportForm.controls.title.value!,
      description: this.reportForm.controls.description.value || undefined,
      type: this.reportForm.controls.type.value as ReportType,
      categoryId: this.reportForm.controls.categoryId.value!,
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
