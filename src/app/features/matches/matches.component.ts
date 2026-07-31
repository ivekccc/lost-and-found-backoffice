import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DatePipe, DecimalPipe } from '@angular/common';
import { NgSelectModule } from '@ng-select/ng-select';
import { AdminMatchListDto, ReportMatchStatus } from '@lost-and-found/api';
import { tap, catchError, debounceTime, switchMap, EMPTY, Subject } from 'rxjs';
import { MatchesApiService } from '../../core/api/matches-api.service';
import {
  DataTableComponent,
  DataTableHeaderTemplateDirective,
  DataTableRowTemplateDirective,
} from '../../shared/components/data-table/data-table.component';
import { DataTableSkeletonComponent } from '../../shared/components/data-table-skeleton/data-table-skeleton.component';
import { ErrorStateComponent } from '../../shared/components/error-state/error-state.component';

const PAGE_SIZE = 20;
const MIN_SCORE_DEBOUNCE_MS = 300;

@Component({
  selector: 'app-matches',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    RouterLink,
    DatePipe,
    DecimalPipe,
    NgSelectModule,
    DataTableComponent,
    DataTableHeaderTemplateDirective,
    DataTableRowTemplateDirective,
    DataTableSkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: './matches.component.html',
  styleUrl: './matches.component.scss',
})
export default class MatchesComponent implements OnInit {
  private matchesApi = inject(MatchesApiService);
  private destroyRef = inject(DestroyRef);

  private loadTrigger = new Subject<void>();
  private minScoreInput = new Subject<number | null>();

  matches = signal<AdminMatchListDto[]>([]);
  loading = signal(true);
  error = signal(false);
  selectedStatus = signal<ReportMatchStatus | null>(null);
  minScore = signal<number | null>(null);
  page = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);

  statusOptions = [{ label: 'Suggested', value: ReportMatchStatus.SUGGESTED }];

  ngOnInit(): void {
    this.loadTrigger
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.error.set(false);
        }),
        switchMap(() =>
          this.matchesApi
            .getMatches({
              page: this.page(),
              size: PAGE_SIZE,
              status: this.selectedStatus() ?? undefined,
              minScore: this.minScore() ?? undefined,
            })
            .pipe(
              tap((result) => {
                const totalPages = result.totalPages ?? 0;
                if (this.page() > 0 && this.page() + 1 > totalPages) {
                  this.page.set(Math.max(0, totalPages - 1));
                  this.loadTrigger.next();
                  return;
                }
                this.matches.set(result.content ?? []);
                this.totalPages.set(totalPages);
                this.totalElements.set(result.totalElements ?? 0);
                this.loading.set(false);
              }),
              catchError(() => {
                this.error.set(true);
                this.loading.set(false);
                return EMPTY;
              }),
            ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.minScoreInput
      .pipe(debounceTime(MIN_SCORE_DEBOUNCE_MS), takeUntilDestroyed(this.destroyRef))
      .subscribe((minScore) => {
        this.minScore.set(minScore);
        this.page.set(0);
        this.loadTrigger.next();
      });

    this.loadTrigger.next();
  }

  reload(): void {
    this.loadTrigger.next();
  }

  onStatusChange(status: ReportMatchStatus | null): void {
    this.selectedStatus.set(status ?? null);
    this.page.set(0);
    this.loadTrigger.next();
  }

  onMinScoreChange(minScore: number | null): void {
    this.minScoreInput.next(minScore);
  }

  previousPage(): void {
    if (this.page() > 0) {
      this.page.update((page) => page - 1);
      this.loadTrigger.next();
    }
  }

  nextPage(): void {
    if (this.page() + 1 < this.totalPages()) {
      this.page.update((page) => page + 1);
      this.loadTrigger.next();
    }
  }

  dismissalLabel(match: AdminMatchListDto): string | null {
    if (match.lostDismissedAt && match.foundDismissedAt) {
      return 'Both sides';
    }
    if (match.lostDismissedAt) {
      return 'Lost side';
    }
    if (match.foundDismissedAt) {
      return 'Found side';
    }
    return null;
  }
}
