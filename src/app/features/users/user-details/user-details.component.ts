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
import { catchError, EMPTY, tap } from 'rxjs';
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

  ngOnInit(): void {
    this._loadUser();
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
