import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  FormArray,
  Validators,
} from '@angular/forms';
import { NgClass } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { Subject, tap, catchError, EMPTY } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';
import {
  AdminQuestionTemplateDto,
  CreateQuestionTemplateRequestDto,
  QuestionKind,
  ReportCategoryDto,
  UpdateQuestionTemplateRequestDto,
} from '@lost-and-found/api';
import { QuestionTemplatesApiService } from '../../../core/api/question-templates-api.service';
import { ConfirmButtonsComponent } from '../../../shared/components/confirm-buttons/confirm-buttons.component';

@Component({
  selector: 'app-question-template-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, NgClass, NgSelectModule, ConfirmButtonsComponent],
  templateUrl: './question-template-form.component.html',
})
export class QuestionTemplateFormComponent implements OnInit {
  private templatesApi = inject(QuestionTemplatesApiService);

  categories: ReportCategoryDto[] = [];
  template: AdminQuestionTemplateDto | null = null;

  onSave: Subject<AdminQuestionTemplateDto> = new Subject();

  isEdit = signal(false);

  templateForm = new FormGroup({
    categoryId: new FormControl<number | null>(null, [Validators.required]),
    prompt: new FormControl('', [Validators.required, Validators.maxLength(500)]),
    kind: new FormControl<QuestionKind>(QuestionKind.TEXT, [Validators.required]),
    isActive: new FormControl(true),
    choices: new FormArray<FormControl<string | null>>([]),
  });

  kindOptions = [
    { label: 'Free text', value: QuestionKind.TEXT },
    { label: 'Multiple choice', value: QuestionKind.CHOICE },
  ];

  QuestionKind = QuestionKind;

  constructor(public bsModalRef: BsModalRef) {}

  get choices(): FormArray<FormControl<string | null>> {
    return this.templateForm.controls.choices;
  }

  get isChoice(): boolean {
    return this.templateForm.controls.kind.value === QuestionKind.CHOICE;
  }

  ngOnInit(): void {
    if (this.template) {
      this.isEdit.set(true);
      this.templateForm.controls.categoryId.setValue(this.template.categoryId);
      this.templateForm.controls.categoryId.disable();
      this.templateForm.controls.prompt.setValue(this.template.prompt);
      this.templateForm.controls.kind.setValue(this.template.kind);
      this.templateForm.controls.isActive.setValue(this.template.isActive);
      (this.template.defaultChoices ?? []).forEach((choice) => this.addChoice(choice));
    }
    if (this.isChoice && this.choices.length === 0) {
      this.addChoice();
      this.addChoice();
    }
  }

  onKindChange(): void {
    if (this.isChoice) {
      while (this.choices.length < 2) {
        this.addChoice();
      }
    } else {
      this.choices.clear();
    }
  }

  addChoice(value = ''): void {
    this.choices.push(new FormControl(value, [Validators.required, Validators.maxLength(100)]));
  }

  removeChoice(index: number): void {
    this.choices.removeAt(index);
  }

  submit(): void {
    if (this.isChoice && this.choices.length < 2) {
      this.choices.markAllAsTouched();
      return;
    }
    if (this.templateForm.invalid) {
      this.templateForm.markAllAsTouched();
      return;
    }

    this.templateForm.disable();

    const defaultChoices = this.isChoice
      ? this.choices.controls.map((control) => control.value!.trim())
      : undefined;

    if (this.isEdit() && this.template) {
      const request: UpdateQuestionTemplateRequestDto = {
        prompt: this.templateForm.controls.prompt.value!,
        kind: this.templateForm.controls.kind.value!,
        defaultChoices,
        isActive: this.templateForm.controls.isActive.value!,
      };
      this.templatesApi
        .update(this.template.id, request)
        .pipe(
          tap((updated) => this.onSave.next(updated)),
          catchError(() => {
            this.templateForm.enable();
            this.templateForm.controls.categoryId.disable();
            return EMPTY;
          }),
        )
        .subscribe();
      return;
    }

    const request: CreateQuestionTemplateRequestDto = {
      categoryId: this.templateForm.controls.categoryId.value!,
      prompt: this.templateForm.controls.prompt.value!,
      kind: this.templateForm.controls.kind.value!,
      defaultChoices,
    };
    this.templatesApi
      .create(request)
      .pipe(
        tap((created) => this.onSave.next(created)),
        catchError(() => {
          this.templateForm.enable();
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
