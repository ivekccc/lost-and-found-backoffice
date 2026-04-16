import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { AppStore } from '../../../app.store';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';

@Component({
  selector: 'app-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private appStore = inject(AppStore);
  private confirmModalService = inject(ConfirmModalService);

  user = this.appStore.state.user;
  fullName = computed(() => {
    const user = this.user();
    return user ? `${user.firstName} ${user.lastName}` : '';
  });

  logout() {
    this.confirmModalService
      .openConfirm('Are you sure you want to logout?', {
        title: 'Logout',
        confirmText: 'Logout',
        destructive: true,
      })
      .pipe(filter((confirmed) => confirmed))
      .subscribe(() => this.authService.logout());
  }
}
