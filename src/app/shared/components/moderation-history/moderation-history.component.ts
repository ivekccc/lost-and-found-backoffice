import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AuditTargetType } from '@lost-and-found/api';
import { AuditApiService } from '../../../core/api/audit-api.service';
import { createPagedLoader } from '../../data/paged-loader';
import { whenPresent } from '../../data/empty-page';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { PanelStateComponent } from '../panel-state/panel-state.component';

@Component({
  selector: 'app-moderation-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RelativeTimePipe, PanelStateComponent],
  template: `
    <section class="panel" aria-labelledby="history-heading">
      <header class="panel__header"><h2 id="history-heading">Moderation history</h2></header>
      @if (history.rows().length) {
        <ol class="history-list">
          @for (entry of history.rows(); track entry.id) {
            <li>
              <p class="mb-0">{{ entry.summary }}</p>
              <p class="mb-0 cell-muted">{{ entry.actorName }} · <span [title]="entry.createdAt | date: 'd MMM y, HH:mm'">{{ entry.createdAt | relativeTime }}</span></p>
            </li>
          }
        </ol>
      }
      <app-panel-state
        [loaded]="history.loaded()"
        [empty]="!history.rows().length"
        [error]="history.error()"
        [emptyText]="emptyText()"
        (retry)="history.reload()"
      />
    </section>
  `,
})
export class ModerationHistoryComponent {
  private readonly auditApi = inject(AuditApiService);

  readonly targetType = input.required<AuditTargetType>();
  readonly targetId = input.required<number | null>();
  readonly emptyText = input('No moderator actions yet.');

  private readonly target = computed(() => {
    const id = this.targetId();
    return id === null ? null : { type: this.targetType(), id };
  });
  protected readonly history = createPagedLoader(
    this.target,
    whenPresent((target: { type: AuditTargetType; id: number }) => this.auditApi.getEntries({ targetType: target.type, targetId: target.id, size: 20 })),
  );

  reload(): void {
    this.history.reload();
  }
}
