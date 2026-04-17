import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { UserDetailsDto } from '@lost-and-found/api';
import { catchError, EMPTY, tap } from 'rxjs';
import { UserApiService } from '../../../core/api/user-api.service';
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
  private userApi = inject(UserApiService);

  user = signal<UserDetailsDto | null>(null);
  loading = signal(true);
  error = signal(false);
  linkCopied = signal(false);

  ngOnInit(): void {
    this._loadUser();
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
