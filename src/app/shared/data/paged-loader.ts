import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, debounceTime, map, merge, of, switchMap, tap } from 'rxjs';

export interface PageLike<T> {
  content?: T[];
  totalElements?: number;
}

export interface PagedLoader<T> {
  rows: Signal<T[]>;
  total: Signal<number>;
  loading: Signal<boolean>;
  loaded: Signal<boolean>;
  error: Signal<unknown>;
  reload: () => void;
  updateRow: (predicate: (row: T) => boolean, update: (row: T) => T) => void;
}

export function createPagedLoader<P, T>(params: Signal<P>, load: (params: P) => Observable<PageLike<T>>): PagedLoader<T> {
  const destroyRef = inject(DestroyRef);
  const rows = signal<T[]>([]);
  const total = signal(0);
  const loading = signal(true);
  const loaded = signal(false);
  const error = signal<unknown>(null);
  const reload$ = new Subject<void>();

  merge(toObservable(params).pipe(debounceTime(0)), reload$.pipe(map(() => params())))
    .pipe(
      tap(() => loading.set(true)),
      switchMap((current) =>
        load(current).pipe(
          map((page) => ({ page, failure: null as unknown })),
          catchError((failure: unknown) => of({ page: null, failure })),
        ),
      ),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe(({ page, failure }) => {
      loading.set(false);
      if (page) {
        rows.set(page.content ?? []);
        total.set(page.totalElements ?? 0);
        error.set(null);
        loaded.set(true);
      } else {
        error.set(failure);
      }
    });

  return {
    rows: rows.asReadonly(),
    total: total.asReadonly(),
    loading: loading.asReadonly(),
    loaded: loaded.asReadonly(),
    error: error.asReadonly(),
    reload: () => reload$.next(),
    updateRow: (predicate, update) => rows.update((current) => current.map((row) => (predicate(row) ? update(row) : row))),
  };
}
