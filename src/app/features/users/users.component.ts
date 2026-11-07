import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { UserListDto, UserRole, UserStatus } from '@lost-and-found/api';
import { UserApiService } from '../../core/api/user-api.service';
import { DataTableComponent, TableColumn, TableEmptyDirective, TableRowDirective } from '../../shared/components/data-table/data-table.component';
import { SelectComponent } from '../../shared/components/select/select.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { StatusBadgeComponent } from '../../shared/ui/status-badge.component';
import { USER_ROLE, USER_STATUS, enumOptions } from '../../shared/ui/status';
import { RelativeTimePipe } from '../../shared/pipes/relative-time.pipe';
import { createListQuery } from '../../shared/data/list-query';
import { createPagedLoader } from '../../shared/data/paged-loader';
import { isInteractiveTarget } from '../../shared/utils/row-navigation';

const FILTERS = ['search', 'status', 'role'] as const;

@Component({
  selector: 'app-users',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectComponent,
    DataTableComponent,
    TableRowDirective,
    TableEmptyDirective,
    PageHeaderComponent,
    SearchInputComponent,
    StatusBadgeComponent,
    RelativeTimePipe,
    DatePipe,
    RouterLink,
  ],
  templateUrl: './users.component.html',
})
export default class UsersComponent {
  private readonly userApi = inject(UserApiService);
  private readonly router = inject(Router);

  protected readonly query = createListQuery({ filters: FILTERS, defaultSort: 'createdAt', defaultDirection: 'desc' });
  protected readonly loader = createPagedLoader(this.query.state, (state) =>
    this.userApi.getUsers({
      page: state.page,
      size: state.size,
      sort: state.sort,
      direction: state.direction,
      search: state.filters.search,
      status: state.filters.status as UserStatus | undefined,
      role: state.filters.role as UserRole | undefined,
    }),
  );

  protected readonly statusOptions = enumOptions(USER_STATUS);
  protected readonly roleOptions = enumOptions(USER_ROLE);
  protected readonly userStatus = USER_STATUS;
  protected readonly userRole = USER_ROLE;
  protected readonly filtered = computed(() => this.query.activeFilterCount() > 0);
  protected readonly columns: TableColumn[] = [
    { key: 'id', label: 'ID', sortKey: 'id', width: '72px' },
    { key: 'name', label: 'Name', sortKey: 'lastName' },
    { key: 'email', label: 'Email', sortKey: 'email' },
    { key: 'phone', label: 'Phone', width: '150px' },
    { key: 'role', label: 'Role', width: '100px' },
    { key: 'status', label: 'Status', sortKey: 'status', width: '120px' },
    { key: 'createdAt', label: 'Joined', sortKey: 'createdAt', width: '130px' },
  ];

  protected openRow(event: Event, user: UserListDto): void {
    if (!isInteractiveTarget(event)) {
      this.router.navigate(['/users', user.id]);
    }
  }

  protected fullName(user: UserListDto): string {
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username;
  }
}
