import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserDetailsDto } from '@lost-and-found/api';
import { catchError, EMPTY, Observable, tap } from 'rxjs';
import { UserApiService } from '../../../core/api/user-api.service';
import { ConfirmModalService } from '../../../shared/services/confirm-modal.service';
import { DetailsSkeletonComponent } from '../../../shared/components/details-skeleton/details-skeleton.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';

@Component({
  selector: 'app-user-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    RouterLink,
    DetailsSkeletonComponent,
    ErrorStateComponent,
  ],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
})
export default class UserDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userApi = inject(UserApiService);
  private confirmModalService = inject(ConfirmModalService);
  private destroyRef = inject(DestroyRef);

  user = signal<UserDetailsDto | null>(null);
  loading = signal(true);
  error = signal(false);
  linkCopied = signal(false);
  deleting = signal(false);
  moderating = signal(false);

  ngOnInit(): void {
    this._loadUser();
  }

  blockUser(): void {
    const user = this.user();
    if (!user) {
      return;
    }
    this.confirmModalService
      .openConfirm(
        `Block ${user.email}? They will be unable to log in, their active listings will be hidden and pending claims declined.`,
        { title: 'Block user', confirmText: 'Block', destructive: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this._moderate(this.userApi.blockUser(user.id));
        }
      });
  }

  partialBlockUser(): void {
    const user = this.user();
    if (!user) {
      return;
    }
    this.confirmModalService
      .openConfirm(
        `Restrict ${user.email}? They can still browse and answer claims, but cannot post found items or send verification questions.`,
        { title: 'Restrict user', confirmText: 'Restrict' },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) {
          this._moderate(this.userApi.partialBlockUser(user.id));
        }
      });
  }

  unblockUser(): void {
    const user = this.user();
    if (!user) {
      return;
    }
    this._moderate(this.userApi.unblockUser(user.id));
  }

  deleteUser(): void {
    const user = this.user();
    if (!user) {
      return;
    }

    this.confirmModalService
      .openConfirm(
        `Delete ${user.email}? This erases their personal data and reports, and anonymizes claims on other users' reports. This cannot be undone.`,
        { title: 'Delete account', confirmText: 'Delete', destructive: true },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.deleting.set(true);
        this.userApi
          .deleteUser(user.id)
          .pipe(
            tap(() => this.router.navigate(['/users'])),
            catchError(() => {
              this.deleting.set(false);
              return EMPTY;
            }),
            takeUntilDestroyed(this.destroyRef),
          )
          .subscribe();
      });
  }

  private _moderate(action: Observable<void>): void {
    this.moderating.set(true);
    action
      .pipe(
        tap(() => {
          this.moderating.set(false);
          this._loadUser();
        }),
        catchError(() => {
          this.moderating.set(false);
          return EMPTY;
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  retryLoad(): void {
    this._loadUser();
  }

  shareLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }

  private _loadUser(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);

    if (!id || Number.isNaN(id)) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.loading.set(true);
    this.error.set(false);

    this.userApi
      .getUserById(id)
      .pipe(
        tap((user) => {
          this.user.set(user);
          this.loading.set(false);
        }),
        catchError(() => {
          this.error.set(true);
          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
