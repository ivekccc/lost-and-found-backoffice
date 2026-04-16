import { signal, Signal, WritableSignal } from '@angular/core';

type SignalStore<T> = {
  readonly [K in keyof T]: Signal<T[K]>;
};

export function createSignalStore<T extends Record<string, any>>(initialState: T) {
  const signals = {} as { [K in keyof T]: WritableSignal<T[K]> };

  const store = Object.entries(initialState).reduce((acc, [key, value]) => {
    const signalProperty = signal(structuredClone(value));
    signals[key as keyof T] = signalProperty;
    return {
      ...acc,
      [key]: signalProperty.asReadonly(),
    };
  }, {} as SignalStore<T>);

  return {
    store,
    update: (updates: Partial<T>) => {
      Object.entries(updates).forEach(([key, value]) => {
        if (key in signals) {
          signals[key as keyof T].set(value);
        }
      });
    },
  };
}
