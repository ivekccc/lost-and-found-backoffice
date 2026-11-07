import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EMPTY, catchError, finalize, tap } from 'rxjs';
import { AdminMatchListDto, ReportStatus } from '@lost-and-found/api';
import { MatchesApiService } from '../../core/api/matches-api.service';
import { ModalService } from '../../shared/services/modal/modal.service';
import { ToastService } from '../../shared/services/toast.service';
import { MatchDetailsModalComponent } from './match-details-modal/match-details-modal.component';
import { DataTableComponent, TableColumn, TableEmptyDirective, TableRowDirective } from '../../shared/components/data-table/data-table.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { REPORT_STATUS } from '../../shared/ui/status';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { createListQuery } from '../../shared/data/list-query';
import { createPagedLoader } from '../../shared/data/paged-loader';
import { isInteractiveTarget } from '../../shared/utils/row-navigation';

const SCORE_OPTIONS = [40, 50, 60, 70, 80, 90].map((score) => ({ value: String(score), label: `${score} or more` }));

@Component({
  selector: 'app-matches',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectComponent,
    DataTableComponent,
    TableRowDirective,
    TableEmptyDirective,
    PageHeaderComponent,
    StatusBadgeComponent,
    RelativeTimePipe,
    DatePipe,
    DecimalPipe,
    RouterLink,
  ],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss',
})
export default class MatchesComponent {
  private readonly matchesApi = inject(MatchesApiService);
  private readonly modalService = inject(ModalService);
  private readonly toastService = inject(ToastService);

  protected readonly query = createListQuery({ filters: ['minScore'] as const, defaultSort: 'createdAt', defaultDirection: 'desc' });
  protected readonly loader = createPagedLoader(this.query.state, (state) =>
    this.matchesApi.getMatches({
      page: state.page,
      size: state.size,
      minScore: state.filters.minScore ? Number(state.filters.minScore) : undefined,
    }),
  );

  protected readonly openingId = signal<number | null>(null);
  protected readonly scoreOptions = SCORE_OPTIONS;
  protected readonly reportStatus = REPORT_STATUS;
  protected readonly activeStatus = ReportStatus.ACTIVE;
  protected readonly columns: TableColumn[] = [
    { key: 'score', label: 'Score', width: '120px' },
    { key: 'lost', label: 'Lost report' },
    { key: 'found', label: 'Found report' },
    { key: 'distance', label: 'Distance', align: 'end', width: '96px' },
    { key: 'gap', label: 'Time apart', align: 'end', width: '104px' },
    { key: 'text', label: 'Text', align: 'end', width: '80px' },
    { key: 'createdAt', label: 'Found', width: '120px' },
  ];

  protected scoreTone(score: number): string {
    return score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
  }

  protected open(event: Event, match: AdminMatchListDto): void {
    if (!isInteractiveTarget(event)) {
      this.openDetails(match);
    }
  }

  protected openDetails(match: AdminMatchListDto): void {
    if (this.openingId() !== null) {
      return;
    }
    this.openingId.set(match.id);
    this.matchesApi
      .getMatch(match.id)
      .pipe(
        finalize(() => this.openingId.set(null)),
        tap((details) => this.modalService.openCentralModal(MatchDetailsModalComponent, { initialState: { data: details } })),
        catchError(() => {
          this.toastService.error('Could not load the match');
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
