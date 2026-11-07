import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastAction {
  label: string;
  run: () => void;
}

export interface Toast {
  id: number;
  tone: ToastTone;
  message: string;
  detail?: string;
  action?: ToastAction;
  leaving: boolean;
}

const DURATION_MS: Record<ToastTone, number> = { success: 4000, info: 5000, error: 7000 };
const LEAVE_MS = 150;
const MAX_VISIBLE = 4;
const DEDUPE_WINDOW_MS = 3000;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private lastKey = '';
  private lastShownAt = 0;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();

  readonly toasts = signal<Toast[]>([]);

  success(message: string, options?: { detail?: string; action?: ToastAction }): void {
    this.show('success', message, options);
  }

  error(message: string, options?: { detail?: string; action?: ToastAction }): void {
    this.show('error', message, options);
  }

  info(message: string, options?: { detail?: string; action?: ToastAction }): void {
    this.show('info', message, options);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
    this.toasts.update((toasts) => toasts.map((toast) => (toast.id === id ? { ...toast, leaving: true } : toast)));
    setTimeout(() => this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id)), LEAVE_MS);
  }

  pause(id: number): void {
    const timer = this.timers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(id);
    }
  }

  resume(id: number): void {
    const toast = this.toasts().find((candidate) => candidate.id === id);
    if (toast && !this.timers.has(id)) {
      this.timers.set(id, setTimeout(() => this.dismiss(id), DURATION_MS[toast.tone]));
    }
  }

  private show(tone: ToastTone, message: string, options?: { detail?: string; action?: ToastAction }): void {
    const key = `${tone}|${message}|${options?.detail ?? ''}`;
    const now = Date.now();
    if (key === this.lastKey && now - this.lastShownAt < DEDUPE_WINDOW_MS) {
      return;
    }
    this.lastKey = key;
    this.lastShownAt = now;

    const id = this.nextId++;
    const toast: Toast = { id, tone, message, detail: options?.detail, action: options?.action, leaving: false };
    this.toasts.update((toasts) => [...toasts, toast].slice(-MAX_VISIBLE));
    this.timers.set(id, setTimeout(() => this.dismiss(id), DURATION_MS[tone]));
  }
}
