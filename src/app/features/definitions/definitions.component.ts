import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EMPTY, catchError, filter, map, switchMap, take, tap } from 'rxjs';
import { AdminQuestionTemplateDto, QuestionKind, ReportCategoryDto } from '@lost-and-found/api';
import { ReportCategoriesApiService } from '../../core/api/report-categories-api.service';
import { QuestionTemplatesApiService } from '../../core/api/question-templates-api.service';
import { ModalService } from '../../shared/services/modal/modal.service';
import { ConfirmModalService } from '../../shared/services/confirm-modal.service';
import { ToastService } from '../../shared/services/toast.service';
import { MinQuestionsFormComponent } from './min-questions-form/min-questions-form.component';
import { CategoryImageFormComponent } from './category-image-form/category-image-form.component';
import { QuestionTemplateFormComponent } from './question-template-form/question-template-form.component';
import { MatchingConfigFormComponent } from './matching-config-form/matching-config-form.component';
import { DataTableComponent, TableColumn, TableEmptyDirective, TableRowDirective } from '../../shared/components/data-table/data-table.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { createPagedLoader } from '../../shared/data/paged-loader';

type DefinitionsTab = 'categories' | 'templates' | 'matching';

const TABS: { id: DefinitionsTab; label: string }[] = [
  { id: 'categories', label: 'Categories' },
  { id: 'templates', label: 'Question templates' },
  { id: 'matching', label: 'Matching' },
];

@Component({
  selector: 'app-definitions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectComponent,
    DataTableComponent,
    TableRowDirective,
    TableEmptyDirective,
    PageHeaderComponent,
    StatusBadgeComponent,
    MatchingConfigFormComponent,
    RouterLink,
  ],
  templateUrl: './definitions.component.html',
})
export default class DefinitionsComponent {
  private readonly categoriesApi = inject(ReportCategoriesApiService);
  private readonly templatesApi = inject(QuestionTemplatesApiService);
  private readonly modalService = inject(ModalService);
  private readonly confirmModal = inject(ConfirmModalService);
  private readonly toastService = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly tabs = TABS;
  protected readonly questionKind = QuestionKind;
  protected readonly activeTab = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => {
        const tab = params.get('tab');
        return TABS.some((candidate) => candidate.id === tab) ? (tab as DefinitionsTab) : 'categories';
      }),
    ),
    { initialValue: 'categories' as DefinitionsTab },
  );
  protected readonly categoryFilter = toSignal(
    this.route.queryParamMap.pipe(map((params) => (params.get('category') ? Number(params.get('category')) : null))),
    { initialValue: null },
  );

  private readonly categoriesTrigger = signal(0);
  protected readonly categories = createPagedLoader(this.categoriesTrigger, () =>
    this.categoriesApi.getAll().pipe(map((content) => ({ content, totalElements: content.length }))),
  );
  protected readonly templates = createPagedLoader(this.categoryFilter, (categoryId) =>
    this.templatesApi.getTemplates(categoryId ?? undefined).pipe(map((content) => ({ content, totalElements: content.length }))),
  );

  protected readonly categoryColumns: TableColumn[] = [
    { key: 'image', label: 'Image', hideLabel: true, width: '64px' },
    { key: 'name', label: 'Name' },
    { key: 'minQuestions', label: 'Minimum questions', align: 'end', width: '180px' },
    { key: 'actions', label: 'Actions', hideLabel: true, align: 'end', width: '220px' },
  ];
  protected readonly templateColumns: TableColumn[] = [
    { key: 'prompt', label: 'Question' },
    { key: 'category', label: 'Category', width: '130px' },
    { key: 'answer', label: 'Answer', width: '180px' },
    { key: 'status', label: 'Status', width: '96px' },
    { key: 'actions', label: 'Actions', hideLabel: true, align: 'end', width: '160px' },
  ];
  protected readonly activeLabel = { label: 'Active', tone: 'success' as const };
  protected readonly inactiveLabel = { label: 'Inactive', tone: 'neutral' as const };
  protected readonly categoryOptions = computed(() => this.categories.rows().map((category) => ({ value: String(category.id), label: category.name })));
  protected readonly categoryName = computed(() => {
    const id = this.categoryFilter();
    return id == null ? null : this.categories.rows().find((category) => category.id === id)?.name ?? `#${id}`;
  });

  protected filterByCategory(value: string): void {
    this.router.navigate([], { relativeTo: this.route, queryParams: { category: value || null }, queryParamsHandling: 'merge', replaceUrl: true });
  }

  protected editMinQuestions(category: ReportCategoryDto): void {
    const modalRef = this.modalService.openRightModal(MinQuestionsFormComponent, { initialState: { category } });
    (modalRef.content as MinQuestionsFormComponent).onSave
      .pipe(
        take(1),
        tap((minQuestions) => {
          modalRef.hide();
          this.categories.updateRow((item) => item.id === category.id, (item) => ({ ...item, minQuestions }));
          this.toastService.success(`${category.name} now needs ${minQuestions} questions`);
        }),
      )
      .subscribe();
  }

  protected editCategoryImage(category: ReportCategoryDto): void {
    const modalRef = this.modalService.openRightModal(CategoryImageFormComponent, { initialState: { category } });
    (modalRef.content as CategoryImageFormComponent).onSave
      .pipe(
        take(1),
        tap((imageUrl) => {
          modalRef.hide();
          this.categories.updateRow((item) => item.id === category.id, (item) => ({ ...item, imageUrl }));
          this.toastService.success(`Image updated for ${category.name}`);
        }),
      )
      .subscribe();
  }

  protected addTemplate(): void {
    const modalRef = this.modalService.openRightModal(QuestionTemplateFormComponent, {
      initialState: { categories: this.categories.rows() },
    });
    (modalRef.content as QuestionTemplateFormComponent).onSave
      .pipe(
        take(1),
        tap(() => {
          modalRef.hide();
          this.templates.reload();
          this.toastService.success('Question added');
        }),
      )
      .subscribe();
  }

  protected editTemplate(template: AdminQuestionTemplateDto): void {
    const modalRef = this.modalService.openRightModal(QuestionTemplateFormComponent, {
      initialState: { categories: this.categories.rows(), template },
    });
    (modalRef.content as QuestionTemplateFormComponent).onSave
      .pipe(
        take(1),
        tap((updated) => {
          modalRef.hide();
          this.templates.updateRow((item) => item.id === updated.id, () => updated);
          this.toastService.success('Question saved');
        }),
      )
      .subscribe();
  }

  protected deactivateTemplate(template: AdminQuestionTemplateDto): void {
    this.confirmModal
      .openConfirm(`“${template.prompt}” will no longer be offered when finders compose their questions. Existing questions are not affected.`, {
        title: 'Deactivate this question?',
        confirmText: 'Deactivate',
        destructive: true,
      })
      .pipe(
        filter((confirmed) => confirmed),
        switchMap(() => this.templatesApi.deactivate(template.id)),
        tap(() => {
            this.templates.updateRow((item) => item.id === template.id, (item) => ({ ...item, isActive: false }));
            this.toastService.success('Question deactivated');
        }),
        catchError(() => EMPTY),
      )
      .subscribe();
  }
}
