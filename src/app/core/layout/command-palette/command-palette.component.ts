import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DialogRef } from '@angular/cdk/dialog';
import { Router } from '@angular/router';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, forkJoin, map, of, switchMap } from 'rxjs';
import { UserApiService } from '../../api/user-api.service';
import { ReportsApiService } from '../../api/reports-api.service';
import { NAVIGATION_GROUPS } from '../navigation';
import { ThemeService } from '../../services/theme.service';

interface Command {
  id: string;
  label: string;
  hint: string;
  icon: string;
  detail?: string;
  run: () => void;
}

const MIN_SEARCH_LENGTH = 2;
const SEARCH_LIMIT = 5;
const SEARCH_DEBOUNCE_MS = 200;

const ID_PATTERN = /^#?(\d{1,10})$/;

@Component({
  selector: 'app-command-palette',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './command-palette.component.html',
  styleUrl: './command-palette.component.scss',
})
export class CommandPaletteComponent {
  private readonly dialogRef = inject(DialogRef);
  private readonly router = inject(Router);
  private readonly themeService = inject(ThemeService);
  private readonly userApi = inject(UserApiService);
  private readonly reportsApi = inject(ReportsApiService);

  protected readonly query = signal('');
  protected readonly activeIndex = signal(0);

  private readonly staticCommands: Command[] = [
    ...NAVIGATION_GROUPS.flatMap((group) =>
      group.items.map((item) => ({
        id: `nav:${item.path}`,
        label: item.label,
        hint: [group.label ?? 'Go to', ...(item.keywords ?? [])].join(' '),
        icon: item.icon,
        run: () => this.go([item.path]),
      })),
    ),
    {
      id: 'theme:toggle',
      label: 'Switch theme',
      hint: 'appearance dark light',
      icon: 'fa-circle-half-stroke',
      run: () => this.themeService.setPreference(this.themeService.resolved() === 'dark' ? 'light' : 'dark'),
    },
  ];

  protected readonly searchFailed = signal(false);
  private readonly settledTerm = signal('');
  protected readonly searching = computed(() => this.isSearchable(this.query().trim()) && this.settledTerm() !== this.query().trim());
  private readonly searchResults = toSignal(
    toObservable(this.query).pipe(
      map((value) => value.trim()),
      debounceTime(SEARCH_DEBOUNCE_MS),
      distinctUntilChanged(),
      switchMap((term) => {
        if (!this.isSearchable(term)) {
          this.searchFailed.set(false);
          this.settledTerm.set(term);
          return of({ term, commands: [] as Command[] });
        }
        this.searchFailed.set(false);
        return forkJoin({
          users: this.userApi.getUsers({ search: term, size: SEARCH_LIMIT }),
          reports: this.reportsApi.getReports({ search: term, size: SEARCH_LIMIT }),
        }).pipe(
          catchError(() => {
            this.searchFailed.set(true);
            return of({ users: { content: [] }, reports: { content: [] } });
          }),
          map(({ users, reports }) => {
            this.settledTerm.set(term);
            return { term, commands: [
              ...(users.content ?? []).map((user) => ({
                id: `user:${user.id}`,
                label: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username,
                detail: user.email,
                hint: '',
                icon: 'fa-user',
                run: () => this.go(['/users', String(user.id)]),
              })),
              ...(reports.content ?? []).map((report) => ({
                id: `report:${report.id}`,
                label: report.title,
                detail: `#${report.id} · ${report.cityName ?? 'no city'}`,
                hint: '',
                icon: 'fa-rectangle-list',
                run: () => this.go(['/reports', String(report.id)]),
              })),
            ] };
          }),
        );
      }),
    ),
    { initialValue: { term: '', commands: [] as Command[] } },
  );

  protected readonly commands = computed<Command[]>(() => {
    const query = this.query().trim().toLowerCase();
    const idMatch = ID_PATTERN.exec(query);
    const jumps: Command[] = idMatch
      ? [
          { id: 'jump:report', label: `Open report #${idMatch[1]}`, hint: '', icon: 'fa-rectangle-list', run: () => this.go(['/reports', idMatch[1]]) },
          { id: 'jump:user', label: `Open user #${idMatch[1]}`, hint: '', icon: 'fa-user', run: () => this.go(['/users', idMatch[1]]) },
        ]
      : [];
    const matching = query
      ? this.staticCommands.filter((command) => `${command.label} ${command.hint}`.toLowerCase().includes(query))
      : this.staticCommands;
    const results = this.searchResults();
    return [...jumps, ...matching, ...(results.term === query ? results.commands : [])];
  });

  private isSearchable(term: string): boolean {
    return term.length >= MIN_SEARCH_LENGTH && !ID_PATTERN.test(term);
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.activeIndex.set(0);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const total = this.commands().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.activeIndex.update((index) => (total ? (index + 1) % total : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.activeIndex.update((index) => (total ? (index - 1 + total) % total : 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = this.commands()[this.activeIndex()];
      if (command) {
        this.execute(command);
      }
    }
  }

  protected execute(command: Command): void {
    this.dialogRef.close();
    command.run();
  }

  private go(commands: string[]): void {
    this.router.navigate(commands);
  }
}
