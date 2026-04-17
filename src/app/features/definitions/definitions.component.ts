import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ReportCategoryDto } from '@lost-and-found/api';
import { tap, catchError, EMPTY } from 'rxjs';
import { ReportCategoriesApiService } from '../../core/api/report-categories-api.service';
import {
  DataTableComponent,
  DataTableHeaderTemplateDirective,
  DataTableRowTemplateDirective,
} from '../../shared/components/data-table/data-table.component';
import { DataTableSkeletonComponent } from '../../shared/components/data-table-skeleton/data-table-skeleton.component';

@Component({
  selector: 'app-definitions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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

  categories = signal<ReportCategoryDto[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this._loadCategories();
  }

  reloadCategories(): void {
    this._loadCategories();
  }

  private _loadCategories(): void {
    this.loading.set(true);
    this.categoriesApi
      .getAll()
      .pipe(
        tap((categories) => {
          this.categories.set(categories);
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
