import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgClass } from '@angular/common';
import { Subject, tap, catchError, EMPTY } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ReportCategoryDto, UpdateMinQuestionsRequestDto } from '@lost-and-found/api';
import { ReportCategoriesApiService } from '../../../core/api/report-categories-api.service';
import { ConfirmButtonsComponent } from '../../../shared/components/confirm-buttons/confirm-buttons.component';

@Component({
  selector: 'app-min-questions-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgClass, ConfirmButtonsComponent],
  templateUrl: './min-questions-form.component.html',
})
export class MinQuestionsFormComponent implements OnInit {
  private categoriesApi = inject(ReportCategoriesApiService);

  category!: ReportCategoryDto;
  onSave: Subject<number> = new Subject();

  minQuestionsForm = new FormGroup({
    minQuestions: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(10),
    ]),
  });

  constructor(public bsModalRef: BsModalRef) {}

  ngOnInit(): void {
    this.minQuestionsForm.controls.minQuestions.setValue(this.category.minQuestions);
  }

  submit(): void {
    if (this.minQuestionsForm.invalid) {
      this.minQuestionsForm.markAllAsTouched();
      return;
    }

    this.minQuestionsForm.disable();

    const minQuestions = this.minQuestionsForm.controls.minQuestions.value!;
    const request: UpdateMinQuestionsRequestDto = { minQuestions };

    this.categoriesApi
      .updateMinQuestions(this.category.id, request)
      .pipe(
        tap(() => this.onSave.next(minQuestions)),
        catchError(() => {
          this.minQuestionsForm.enable();
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
