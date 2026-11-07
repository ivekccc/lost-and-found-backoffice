import { DOCUMENT } from '@angular/common';
import { Injectable, NgZone, inject } from '@angular/core';
import { AuthService, LAST_ACTIVITY_KEY } from './auth.service';
import { ToastService } from '../../shared/services/toast.service';

const IDLE_LIMIT_MS = 30 * 60 * 1000;
const CHECK_INTERVAL_MS = 30 * 1000;
const ACTIVITY_THROTTLE_MS = 15 * 1000;
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'] as const;
const LISTENER_OPTIONS: AddEventListenerOptions = { capture: true, passive: true };

@Injectable({ providedIn: 'root' })
export class IdleSignOutService {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private lastWrite = 0;
  private timer: ReturnType<typeof setInterval> | null = null;

  start(): void {
    if (this.timer) {
      return;
    }
    if (this.storedActivity() === null) {
      this.markActive(true);
    } else if (this.expired()) {
      this.signOut();
      return;
    }
    this.zone.runOutsideAngular(() => {
      for (const type of ACTIVITY_EVENTS) {
        this.document.addEventListener(type, this.onActivity, LISTENER_OPTIONS);
      }
      this.document.addEventListener('visibilitychange', this.onVisibility);
      this.timer = setInterval(() => this.check(), CHECK_INTERVAL_MS);
    });
  }

  stop(): void {
    for (const type of ACTIVITY_EVENTS) {
      this.document.removeEventListener(type, this.onActivity, LISTENER_OPTIONS);
    }
    this.document.removeEventListener('visibilitychange', this.onVisibility);
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private readonly onActivity = (): void => {
    if (this.expired()) {
      this.signOut();
      return;
    }
    this.markActive(false);
  };

  private readonly onVisibility = (): void => {
    if (this.document.visibilityState === 'visible') {
      this.check();
    }
  };

  private markActive(force: boolean): void {
    const now = Date.now();
    if (!force && now - this.lastWrite < ACTIVITY_THROTTLE_MS) {
      return;
    }
    this.lastWrite = now;
    try {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    } catch {
      return;
    }
  }

  private check(): void {
    if (!this.authService.getToken()) {
      this.stop();
      return;
    }
    if (this.expired()) {
      this.signOut();
    }
  }

  private storedActivity(): number | null {
    try {
      const stored = Number(localStorage.getItem(LAST_ACTIVITY_KEY));
      return stored > 0 ? stored : null;
    } catch {
      return null;
    }
  }

  private expired(): boolean {
    const last = Math.max(this.lastWrite, this.storedActivity() ?? 0);
    return Date.now() - last > IDLE_LIMIT_MS;
  }

  private signOut(): void {
    this.zone.run(() => {
      this.stop();
      this.authService.logout();
      this.toastService.info('Signed out after 30 minutes without activity');
    });
  }
}
