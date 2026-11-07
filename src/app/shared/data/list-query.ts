import { computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { map } from 'rxjs';

export type SortDirection = 'asc' | 'desc';

export interface ListQueryConfig<TFilter extends string> {
  filters: readonly TFilter[];
  defaultSort: string;
  defaultDirection: SortDirection;
  defaultSize?: number;
  defaultFilters?: Partial<Record<TFilter, string>>;
}

export const ALL_VALUE = 'all';

export interface ListQueryState<TFilter extends string> {
  page: number;
  size: number;
  sort: string;
  direction: SortDirection;
  filters: Partial<Record<TFilter, string>>;
}

const PAGE_SIZES = [25, 50, 100];

export function createListQuery<TFilter extends string>(config: ListQueryConfig<TFilter>) {
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  const defaultSize = config.defaultSize ?? PAGE_SIZES[0];

  const parse = (params: ParamMap): ListQueryState<TFilter> => {
    const page = Number(params.get('page'));
    const size = Number(params.get('size'));
    const direction = params.get('direction');
    const filters: Partial<Record<TFilter, string>> = {};
    for (const key of config.filters) {
      const value = params.get(key) ?? config.defaultFilters?.[key];
      if (value && value !== ALL_VALUE) {
        filters[key] = value;
      }
    }
    return {
      page: Number.isInteger(page) && page > 0 ? page - 1 : 0,
      size: PAGE_SIZES.includes(size) ? size : defaultSize,
      sort: params.get('sort') || config.defaultSort,
      direction: direction === 'asc' || direction === 'desc' ? direction : config.defaultDirection,
      filters,
    };
  };

  const state = toSignal(route.queryParamMap.pipe(map(parse)), { initialValue: parse(route.snapshot.queryParamMap) });
  const activeFilterCount = computed(
    () => Object.keys(state().filters).filter((key) => state().filters[key as TFilter] !== config.defaultFilters?.[key as TFilter]).length,
  );

  const navigate = (queryParams: Record<string, string | number | null>) =>
    router.navigate([], { relativeTo: route, queryParams, queryParamsHandling: 'merge', replaceUrl: true });

  return {
    state,
    activeFilterCount,
    pageSizes: PAGE_SIZES,
    setFilter(key: TFilter, value: string | number | null | undefined): void {
      const fallback = config.defaultFilters?.[key];
      let normalized = value === undefined || value === null || value === '' ? null : String(value);
      if (fallback !== undefined) {
        normalized = normalized === null ? ALL_VALUE : normalized === fallback ? null : normalized;
      }
      navigate({ [key]: normalized, page: null });
    },
    setPage(page: number): void {
      navigate({ page: page > 0 ? page + 1 : null });
    },
    setSize(size: number): void {
      navigate({ size: size === defaultSize ? null : size, page: null });
    },
    toggleSort(column: string): void {
      const current = state();
      const direction: SortDirection =
        current.sort === column ? (current.direction === 'asc' ? 'desc' : 'asc') : 'asc';
      navigate({ sort: column, direction, page: null });
    },
    clearFilters(): void {
      const cleared: Record<string, null> = { page: null };
      for (const key of config.filters) {
        cleared[key] = null;
      }
      navigate(cleared);
    },
  };
}

export type ListQuery<TFilter extends string> = ReturnType<typeof createListQuery<TFilter>>;
