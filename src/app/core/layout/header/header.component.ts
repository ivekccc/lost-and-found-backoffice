import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { CdkMenu, CdkMenuItem, CdkMenuItemRadio, CdkMenuTrigger } from '@angular/cdk/menu';
import { filter, tap } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { ThemePreference, ThemeService } from '../../services/theme.service';
import { AppStore } from '../../../app.store';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';
import { CommandPaletteService } from '../command-palette/command-palette.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkMenuTrigger, CdkMenu, CdkMenuItem, CdkMenuItemRadio],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly appStore = inject(AppStore);
  private readonly confirmModalService = inject(ConfirmModalService);
  protected readonly themeService = inject(ThemeService);
  protected readonly commandPalette = inject(CommandPaletteService);

  readonly navigationOpen = input(false);
  readonly toggleNavigation = output<void>();

  protected readonly isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
  protected readonly user = this.appStore.state.user;
  protected readonly fullName = computed(() => {
    const user = this.user();
    return user ? `${user.firstName} ${user.lastName}`.trim() : '';
  });
  protected readonly initials = computed(() => {
    const user = this.user();
    if (!user) {
      return '';
    }
    return `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase();
  });
  protected readonly themeOptions: { value: ThemePreference; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  protected setTheme(preference: ThemePreference): void {
    this.themeService.setPreference(preference);
  }

  protected signOut(): void {
    this.confirmModalService
      .openConfirm('You will need to sign in again to continue.', {
        title: 'Sign out?',
        confirmText: 'Sign out',
      })
      .pipe(
        filter((confirmed) => confirmed),
        tap(() => this.authService.logout()),
      )
      .subscribe();
  }
}
