import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  TemplateRef,
  computed,
  contentChild,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ErrorStateComponent } from '../error-state/error-state.component';
import { SelectComponent } from '../select/select.component';
import { describeHttpError } from '../../../core/utils/http-error';

export interface TableColumn {
  key: string;
  label: string;
  sortKey?: string;
  align?: 'start' | 'end';
  width?: string;
  hideLabel?: boolean;
}

export interface TableRowContext<T> {
  $implicit: T;
  selected: boolean;
  toggle: () => void;
}

@Directive({ selector: '[appTableRow]' })
export class TableRowDirective<T> {
  readonly template = inject(TemplateRef);
  readonly appTableRowOf = input<T[]>();

  static ngTemplateContextGuard<T>(_directive: TableRowDirective<T>, context: unknown): context is TableRowContext<T> {
    return true;
  }
}

@Directive({ selector: '[appTableEmpty]' })
export class TableEmptyDirective {
  readonly template = inject(TemplateRef);
}

const SKELETON_ROWS = 8;

@Component({
  selector: 'app-data-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, ErrorStateComponent, SelectComponent],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss',
})
export class DataTableComponent<T> {
  readonly caption = input.required<string>();
  readonly columns = input.required<TableColumn[]>();
  readonly rows = input.required<T[]>();
  readonly total = input(0);
  readonly page = input(0);
  readonly size = input(25);
  readonly pageSizes = input<number[]>([25, 50, 100]);
  readonly sort = input<string>();
  readonly direction = input<'asc' | 'desc'>('desc');
  readonly loading = input(false);
  readonly loaded = input(true);
  readonly error = input<unknown>(null);
  readonly selectable = input(false);
  readonly selectedIds = input<ReadonlySet<number>>(new Set());
  readonly rowId = input<(row: T) => number>((row) => (row as { id: number }).id);
  readonly paginated = input(true);

  readonly sortChange = output<string>();
  readonly pageChange = output<number>();
  readonly sizeChange = output<number>();
  readonly selectionChange = output<ReadonlySet<number>>();
  readonly retry = output<void>();

  protected readonly rowTemplate = contentChild.required(TableRowDirective);
  protected readonly emptyTemplate = contentChild(TableEmptyDirective);
  protected readonly skeletonRows = Array.from({ length: SKELETON_ROWS }, (_, index) => index);

  protected readonly sizeOptions = computed(() => this.pageSizes().map((option) => ({ value: String(option), label: String(option) })));
  protected readonly columnCount = computed(() => this.columns().length + (this.selectable() ? 1 : 0));
  protected readonly showSkeleton = computed(() => this.loading() && !this.loaded());
  protected readonly errorDescription = computed(() => (this.error() ? describeHttpError(this.error()) : null));
  protected readonly firstRow = computed(() => (this.total() === 0 ? 0 : this.page() * this.size() + 1));
  protected readonly lastRow = computed(() => Math.min((this.page() + 1) * this.size(), this.total()));
  protected readonly lastPage = computed(() => Math.max(Math.ceil(this.total() / this.size()) - 1, 0));
  protected readonly allSelected = computed(() => {
    const rows = this.rows();
    return rows.length > 0 && rows.every((row) => this.selectedIds().has(this.rowId()(row)));
  });
  protected readonly someSelected = computed(() => !this.allSelected() && this.rows().some((row) => this.selectedIds().has(this.rowId()(row))));

  constructor() {
    effect(() => {
      const stranded = !this.loading() && this.loaded() && !this.error() && this.rows().length === 0 && this.page() > 0 && this.total() > 0;
      if (stranded) {
        untracked(() => this.pageChange.emit(this.lastPage()));
      }
    });
  }

  protected ariaSort(column: TableColumn): string | null {
    if (!column.sortKey || column.sortKey !== this.sort()) {
      return null;
    }
    return this.direction() === 'asc' ? 'ascending' : 'descending';
  }

  protected context(row: T): TableRowContext<T> {
    const id = this.rowId()(row);
    return { $implicit: row, selected: this.selectedIds().has(id), toggle: () => this.toggle(id) };
  }

  protected toggleAll(): void {
    const next = new Set(this.selectedIds());
    const ids = this.rows().map((row) => this.rowId()(row));
    if (this.allSelected()) {
      ids.forEach((id) => next.delete(id));
    } else {
      ids.forEach((id) => next.add(id));
    }
    this.selectionChange.emit(next);
  }

  private toggle(id: number): void {
    const next = new Set(this.selectedIds());
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    this.selectionChange.emit(next);
  }
}
