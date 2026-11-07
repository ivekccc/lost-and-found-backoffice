import { DestroyRef, Signal, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Observable, Subject, catchError, map, merge, of, switchMap, tap } from 'rxjs';

export interface ResourceLoader<T> {
  value: Signal<T | null>;
  loading: Signal<boolean>;
  error: Signal<unknown>;
  reload: () => void;
  set: (value: T) => void;
}

export function createResourceLoader<P, T>(params: Signal<P | null>, load: (params: P) => Observable<T>): ResourceLoader<T> {
  const destroyRef = inject(DestroyRef);
  const value = signal<T | null>(null);
  const loading = signal(true);
  const error = signal<unknown>(null);
  const reload$ = new Subject<void>();

  merge(
    toObservable(params).pipe(tap(() => value.set(null))),
    reload$.pipe(map(() => params())),
  )
    .pipe(
      tap(() => {
        loading.set(true);
        error.set(null);
      }),
      switchMap((current) =>
        current === null
          ? of({ result: null as T | null, failure: new Error('Invalid identifier') as unknown })
          : load(current).pipe(
              map((result) => ({ result: result as T | null, failure: null as unknown })),
              catchError((failure: unknown) => of({ result: null as T | null, failure })),
            ),
      ),
      takeUntilDestroyed(destroyRef),
    )
    .subscribe(({ result, failure }) => {
      loading.set(false);
      error.set(failure);
      if (result !== null || failure) {
        value.set(result);
      }
    });

  return {
    value: value.asReadonly(),
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    reload: () => reload$.next(),
    set: (next: T) => value.set(next),
  };
}

export function routeId$(source: Observable<string | null>): Observable<number | null> {
  return source.pipe(
    map((raw) => {
      const id = Number(raw);
      return Number.isInteger(id) && id > 0 ? id : null;
    }),
  );
}
