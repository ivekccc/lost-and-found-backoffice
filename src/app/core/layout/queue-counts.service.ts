import { Injectable, computed, inject, signal } from '@angular/core';
import { QueueCountsDto } from '@lost-and-found/api';
import { catchError, EMPTY, tap } from 'rxjs';
import { DashboardApiService } from '../api/dashboard-api.service';

const MIN_REFRESH_INTERVAL_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class QueueCountsService {
  private readonly dashboardApi = inject(DashboardApiService);
  private lastRefreshAt = 0;
  private readonly queues = signal<QueueCountsDto | null>(null);
  private readonly failed = signal(false);

  readonly error = this.failed.asReadonly();

  readonly current = this.queues.asReadonly();
  readonly counts = computed((): Record<string, number> => {
    const queues = this.queues();
    if (!queues) {
      return {};
    }
    return {
      pendingAbuseReports: queues.pendingAbuseReports,
      flaggedReports: queues.flaggedReports,
      pendingClaims: queues.pendingClaims,
    };
  });

  refresh(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastRefreshAt < MIN_REFRESH_INTERVAL_MS) {
      return;
    }
    this.lastRefreshAt = now;
    this.dashboardApi
      .getQueues()
      .pipe(
        tap((queues) => {
          this.queues.set(queues);
          this.failed.set(false);
        }),
        catchError(() => {
          this.failed.set(true);
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
