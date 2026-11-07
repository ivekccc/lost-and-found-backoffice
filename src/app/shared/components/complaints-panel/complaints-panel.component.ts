import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AbuseReportsApiService } from '../../../core/api/abuse-reports-api.service';
import { createPagedLoader } from '../../data/paged-loader';
import { whenPresent } from '../../data/empty-page';
import { ALL_VALUE } from '../../data/list-query';
import { RelativeTimePipe } from '../../pipes/relative-time.pipe';
import { StatusBadgeComponent } from '../../ui/status-badge.component';
import { ABUSE_REASON, ABUSE_STATUS } from '../../ui/status';
import { PanelStateComponent } from '../panel-state/panel-state.component';

const PREVIEW_SIZE = 5;

@Component({
  selector: 'app-complaints-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RelativeTimePipe, StatusBadgeComponent, PanelStateComponent],
  template: `
    <section class="panel" aria-labelledby="complaints-heading">
      <header class="panel__header">
        <h2 id="complaints-heading">{{ heading() }} <span class="cell-muted tabular">{{ complaints.total() }}</span></h2>
        @if (complaints.total() > 0) {
          <a class="btn btn-ghost btn-sm" routerLink="/abuse-reports" [queryParams]="queueLink()">View in queue</a>
        }
      </header>
      @if (complaints.rows().length) {
        <table class="table">
          <caption class="visually-hidden">{{ heading() }}</caption>
          <tbody>
            @for (complaint of complaints.rows(); track complaint.id) {
              <tr>
                <td>{{ reason[complaint.reason] }}<span class="d-block cell-muted cell-truncate">{{ complaint.message }}</span></td>
                <td class="col-person cell-muted">{{ complaint.reporterName }}</td>
                <td class="col-status"><app-status [value]="status[complaint.status]" /></td>
                <td class="col-time cell-muted text-end">{{ complaint.createdAt | relativeTime }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
      <app-panel-state
        [loaded]="complaints.loaded()"
        [empty]="!complaints.rows().length"
        [error]="complaints.error()"
        emptyText="No complaints."
        (retry)="complaints.reload()"
      />
    </section>
  `,
})
export class ComplaintsPanelComponent {
  private readonly abuseApi = inject(AbuseReportsApiService);

  readonly reportId = input<number | null>(null);
  readonly userId = input<number | null>(null);
  readonly heading = input('Complaints');

  private readonly filter = computed(() => {
    const reportId = this.reportId();
    const userId = this.userId();
    return reportId === null && userId === null ? null : { reportId: reportId ?? undefined, userId: userId ?? undefined };
  });
  protected readonly complaints = createPagedLoader(
    this.filter,
    whenPresent((filter: { reportId?: number; userId?: number }) => this.abuseApi.getReports({ ...filter, size: PREVIEW_SIZE })),
  );
  protected readonly queueLink = computed(() => ({ ...this.filter(), status: ALL_VALUE }));
  protected readonly reason = ABUSE_REASON;
  protected readonly status = ABUSE_STATUS;

  reload(): void {
    this.complaints.reload();
  }
}
