import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { UserListDto, UserRole } from '@lost-and-found/api';
import { tap, catchError, EMPTY } from 'rxjs';
import { UserApiService } from '../../core/api/user-api.service';
import {
  DataTableComponent,
  DataTableHeaderTemplateDirective,
  DataTableRowTemplateDirective,
} from '../../shared/components/data-table/data-table.component';
import { DataTableSkeletonComponent } from '../../shared/components/data-table-skeleton/data-table-skeleton.component';

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DataTableComponent,
    DataTableHeaderTemplateDirective,
    DataTableRowTemplateDirective,
    DataTableSkeletonComponent,
    DatePipe,
  ],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export default class UsersComponent implements OnInit {
  private userApi = inject(UserApiService);

  users = signal<UserListDto[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this._loadUsers();
  }

  reloadUsers(): void {
    this._loadUsers();
  }

  private _loadUsers(): void {
    this.loading.set(true);
    this.userApi
      .getAllUsers(UserRole.USER)
      .pipe(
        tap((users) => {
          this.users.set(users);
          this.loading.set(false);
        }),
        catchError(() => {
          this.loading.set(false);
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
