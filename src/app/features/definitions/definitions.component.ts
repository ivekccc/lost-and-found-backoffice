import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import {
  AdminQuestionTemplateDto,
  QuestionKind,
  ReportCategoryDto,
} from '@lost-and-found/api';
import { tap, catchError, EMPTY } from 'rxjs';
import { ReportCategoriesApiService } from '../../core/api/report-categories-api.service';
import { QuestionTemplatesApiService } from '../../core/api/question-templates-api.service';
import { ModalService } from '../../shared/services/modal/modal.service';
import { ConfirmModalService } from '../../shared/services/confirm-modal.service';
import {
  DataTableComponent,
  DataTableHeaderTemplateDirective,
  DataTableRowTemplateDirective,
} from '../../shared/components/data-table/data-table.component';
import { DataTableSkeletonComponent } from '../../shared/components/data-table-skeleton/data-table-skeleton.component';
import { MinQuestionsFormComponent } from './min-questions-form/min-questions-form.component';
import { QuestionTemplateFormComponent } from './question-template-form/question-template-form.component';
import { CategoryImageFormComponent } from './category-image-form/category-image-form.component';

type DefinitionsTab = 'categories' | 'templates';

@Component({
  selector: 'app-definitions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NgSelectModule,
    DataTableComponent,
    DataTableHeaderTemplateDirective,
    DataTableRowTemplateDirective,
    DataTableSkeletonComponent,
  ],
  templateUrl: './definitions.component.html',
  styleUrl: './definitions.component.scss',
})
export default class DefinitionsComponent implements OnInit {
  private categoriesApi = inject(ReportCategoriesApiService);
  private templatesApi = inject(QuestionTemplatesApiService);
  private modalService = inject(ModalService);
  private confirmModal = inject(ConfirmModalService);
  private destroyRef = inject(DestroyRef);

  QuestionKind = QuestionKind;

  activeTab = signal<DefinitionsTab>('categories');

  categories = signal<ReportCategoryDto[]>([]);
  categoriesLoading = signal(true);

  templates = signal<AdminQuestionTemplateDto[]>([]);
  templatesLoading = signal(true);
  selectedCategoryId = signal<number | null>(null);

  ngOnInit(): void {
    this._loadCategories();
    this._loadTemplates();
  }

  selectTab(tab: DefinitionsTab): void {
    this.activeTab.set(tab);
  }

  reloadCategories(): void {
    this._loadCategories();
  }

  reloadTemplates(): void {
    this._loadTemplates();
  }

  onCategoryFilterChange(categoryId: number | null): void {
    this.selectedCategoryId.set(categoryId ?? null);
    this._loadTemplates();
  }

  editMinQuestions(category: ReportCategoryDto): void {
    const modalRef = this.modalService.openRightModal(MinQuestionsFormComponent, {
      initialState: { category },
    });
    const form = modalRef.content as MinQuestionsFormComponent;

    form.onSave.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((minQuestions) => {
      modalRef.hide();
      this.categories.update((categories) =>
        categories.map((item) =>
          item.id === category.id ? { ...item, minQuestions } : item,
        ),
      );
    });
  }

  editCategoryImage(category: ReportCategoryDto): void {
    const modalRef = this.modalService.openRightModal(CategoryImageFormComponent, {
      initialState: { category },
    });
    const form = modalRef.content as CategoryImageFormComponent;

    form.onSave.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((imageUrl) => {
      modalRef.hide();
      this.categories.update((categories) =>
        categories.map((item) =>
          item.id === category.id ? { ...item, imageUrl } : item,
        ),
      );
    });
  }

  addTemplate(): void {
    const modalRef = this.modalService.openRightModal(QuestionTemplateFormComponent, {
      initialState: { categories: this.categories() },
    });
    const form = modalRef.content as QuestionTemplateFormComponent;

    form.onSave.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((created) => {
      modalRef.hide();
      const filterId = this.selectedCategoryId();
      if (filterId == null || filterId === created.categoryId) {
        this.templates.update((templates) => [created, ...templates]);
      }
    });
  }

  editTemplate(template: AdminQuestionTemplateDto): void {
    const modalRef = this.modalService.openRightModal(QuestionTemplateFormComponent, {
      initialState: { categories: this.categories(), template },
    });
    const form = modalRef.content as QuestionTemplateFormComponent;

    form.onSave.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((updated) => {
      modalRef.hide();
      this.templates.update((templates) =>
        templates.map((item) => (item.id === updated.id ? updated : item)),
      );
    });
  }

  deactivateTemplate(template: AdminQuestionTemplateDto): void {
    this.confirmModal
      .openConfirm(
        `Deactivate "${template.prompt}"? It will no longer be offered when composing challenges.`,
        { title: 'Deactivate question', confirmText: 'Deactivate', destructive: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.templatesApi
          .deactivate(template.id)
          .pipe(
            tap(() =>
              this.templates.update((templates) =>
                templates.map((item) =>
                  item.id === template.id ? { ...item, isActive: false } : item,
                ),
              ),
            ),
            catchError(() => EMPTY),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe();
      });
  }

  private _loadCategories(): void {
    this.categoriesLoading.set(true);
    this.categoriesApi
      .getAll()
      .pipe(
        tap((categories) => {
          this.categories.set(categories);
          this.categoriesLoading.set(false);
        }),
        catchError(() => {
          this.categoriesLoading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private _loadTemplates(): void {
    this.templatesLoading.set(true);
    this.templatesApi
      .getTemplates(this.selectedCategoryId() ?? undefined)
      .pipe(
        tap((templates) => {
          this.templates.set(templates);
          this.templatesLoading.set(false);
        }),
        catchError(() => {
          this.templatesLoading.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
