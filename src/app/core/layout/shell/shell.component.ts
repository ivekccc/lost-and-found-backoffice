import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, tap } from 'rxjs';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { CommandPaletteService } from '../command-palette/command-palette.service';
import { QueueCountsService } from '../queue-counts.service';
import { IdleSignOutService } from '../../services/idle-sign-out.service';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, SidebarComponent, HeaderComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly commandPalette = inject(CommandPaletteService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly queueCounts = inject(QueueCountsService);
  protected readonly navigationOpen = signal(false);
  private readonly compactQuery = window.matchMedia('(max-width: 991.98px)');
  protected readonly compact = signal(this.compactQuery.matches);

  constructor() {
    const onCompactChange = (event: MediaQueryListEvent) => this.compact.set(event.matches);
    this.compactQuery.addEventListener('change', onCompactChange);
    inject(DestroyRef).onDestroy(() => this.compactQuery.removeEventListener('change', onCompactChange));
    const idleSignOut = inject(IdleSignOutService);
    idleSignOut.start();
    inject(DestroyRef).onDestroy(() => idleSignOut.stop());
    inject(Router)
      .events.pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .pipe(
        tap(() => {
          this.navigationOpen.set(false);
          this.queueCounts.refresh();
        }),
      )
      .subscribe();
  }

  @HostListener('document:keydown', ['$event'])
  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.commandPalette.toggle();
    } else if (event.key === 'Escape' && this.navigationOpen()) {
      this.closeNavigation(true);
    }
  }

  protected toggleNavigation(): void {
    if (this.navigationOpen()) {
      this.closeNavigation(true);
      return;
    }
    this.navigationOpen.set(true);
    this.focusLater('#main-navigation a[href]');
  }

  protected closeNavigation(restoreFocus: boolean): void {
    this.navigationOpen.set(false);
    if (restoreFocus) {
      this.focusLater('.header__menu');
    }
  }

  private focusLater(selector: string): void {
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(selector)?.focus());
  }
}
