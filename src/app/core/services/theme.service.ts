import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme_preference';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly media = this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)');
  private readonly systemDark = signal(this.media?.matches ?? false);

  readonly preference = signal<ThemePreference>(this.readPreference());
  readonly resolved = computed(() => {
    const preference = this.preference();
    if (preference === 'system') {
      return this.systemDark() ? 'dark' : 'light';
    }
    return preference;
  });

  init(): void {
    this.media?.addEventListener('change', (event) => {
      this.systemDark.set(event.matches);
      this.apply();
    });
    this.apply();
  }

  setPreference(preference: ThemePreference): void {
    this.preference.set(preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      return this.apply();
    }
    this.apply();
  }

  private apply(): void {
    this.document.documentElement.setAttribute('data-bs-theme', this.resolved());
  }

  private readPreference(): ThemePreference {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : 'system';
    } catch {
      return 'system';
    }
  }
}
