import { ChangeDetectionStrategy, Component, computed, inject, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CdkMenu, CdkMenuItem, CdkMenuTrigger } from '@angular/cdk/menu';
import { map, tap } from 'rxjs';
import { AppLanguage, AuditTargetType, UserDetailsDto, UserRole, UserStatus } from '@lost-and-found/api';
import { UserApiService } from '../../../core/api/user-api.service';
import { ReportsApiService } from '../../../core/api/reports-api.service';
import { ClaimsApiService } from '../../../core/api/claims-api.service';
import { ToastService } from '../../../shared/services/toast.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ErrorStateComponent } from '../../../shared/components/error-state/error-state.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { CLAIM_STATUS, REPORT_STATUS, REPORT_TYPE, USER_ROLE, USER_STATUS } from '../../../shared/ui/status';
import { RelativeTimePipe } from '../../../shared/pipes/relative-time.pipe';
import { createResourceLoader, routeId$ } from '../../../shared/data/resource-loader';
import { createPagedLoader } from '../../../shared/data/paged-loader';
import { whenPresent } from '../../../shared/data/empty-page';
import { ModerationActionService, ModerationAction } from '../../../shared/services/moderation-action.service';
import { ModerationHistoryComponent } from '../../../shared/components/moderation-history/moderation-history.component';
import { ComplaintsPanelComponent } from '../../../shared/components/complaints-panel/complaints-panel.component';
import { PanelStateComponent } from '../../../shared/components/panel-state/panel-state.component';
import { describeHttpError } from '../../../core/utils/http-error';

const PREVIEW_SIZE = 5;

@Component({
  selector: 'app-user-details',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageHeaderComponent, ErrorStateComponent, StatusBadgeComponent, RelativeTimePipe, DatePipe, RouterLink, CdkMenuTrigger, CdkMenu, CdkMenuItem, ModerationHistoryComponent, ComplaintsPanelComponent, PanelStateComponent],
  templateUrl: './user-details.component.html',
  styleUrl: './user-details.component.scss',
})
export default class UserDetailsComponent {
  private readonly router = inject(Router);
  private readonly userApi = inject(UserApiService);
  private readonly reportsApi = inject(ReportsApiService);
  private readonly claimsApi = inject(ClaimsApiService);
  private readonly toastService = inject(ToastService);

  private readonly userId = toSignal(routeId$(inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id')))), {
    initialValue: null,
  });
  protected readonly user = createResourceLoader(this.userId, (id) => this.userApi.getUserById(id));
  protected readonly reports = createPagedLoader(this.userId, whenPresent((id: number) => this.reportsApi.getReports({ ownerId: id, size: PREVIEW_SIZE })));
  protected readonly claims = createPagedLoader(this.userId, whenPresent((id: number) => this.claimsApi.getClaims({ claimantId: id, size: PREVIEW_SIZE })));
  private readonly complaints = viewChild(ComplaintsPanelComponent);
  private readonly history = viewChild(ModerationHistoryComponent);
  protected readonly moderation = inject(ModerationActionService);
  protected readonly id = this.userId;
  protected readonly auditTarget = AuditTargetType.USER;
  protected readonly loadError = computed(() => (this.user.error() ? describeHttpError(this.user.error()) : null));
  protected readonly fullName = computed(() => {
    const user = this.user.value();
    return user ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.username : 'User';
  });
  protected readonly canModerate = computed(() => {
    const user = this.user.value();
    return !!user && user.role !== UserRole.ADMIN && user.status !== UserStatus.DELETED;
  });
  protected readonly isRestricted = computed(() => {
    const status = this.user.value()?.status;
    return status === UserStatus.BLOCKED || status === UserStatus.PARTIALLY_BLOCKED;
  });

  protected readonly userStatus = USER_STATUS;
  protected readonly userRole = USER_ROLE;
  protected readonly reportStatus = REPORT_STATUS;
  protected readonly reportType = REPORT_TYPE;
  protected readonly claimStatus = CLAIM_STATUS;
  protected readonly statuses = UserStatus;
  protected readonly roles = UserRole;
  protected readonly languages: Record<AppLanguage, string> = { [AppLanguage.SR_LATN]: 'Serbian', [AppLanguage.EN]: 'English' };

  protected restrict(user: UserDetailsDto): void {
    this.runAndRefresh({
      title: 'Restrict this user?',
      message: `${user.email} can still browse and answer questions, but cannot post found items or send verification questions. Pending complaints about them are closed as actioned.`,
      confirmText: 'Restrict user',
      run: () => this.userApi.partialBlockUser(user.id),
      doneMessage: 'User restricted',
    });
  }

  protected block(user: UserDetailsDto): void {
    this.runAndRefresh({
      title: 'Block this user?',
      message: `${user.email} will be signed out and cannot sign in. Their active reports are hidden and pending claims on them are declined.`,
      confirmText: 'Block user',
      destructive: true,
      run: () => this.userApi.blockUser(user.id),
      doneMessage: 'User blocked',
    });
  }

  protected unblock(user: UserDetailsDto): void {
    this.runAndRefresh({
      title: 'Lift the restrictions?',
      message: `${user.email} gets full access back. Reports hidden by the block become visible again.`,
      confirmText: 'Lift restrictions',
      run: () => this.userApi.unblockUser(user.id),
      doneMessage: 'Restrictions lifted',
    });
  }

  protected revokeSessions(user: UserDetailsDto): void {
    this.runAndRefresh({
      title: 'Sign out of every device?',
      message: `${user.email} will need to sign in again on every phone and browser. Use this after a suspected account takeover.`,
      confirmText: 'Sign out everywhere',
      run: () => this.userApi.revokeSessions(user.id),
      doneMessage: 'Signed out of every device',
    });
  }

  protected deleteAccount(user: UserDetailsDto): void {
    this.moderation
      .confirm({
        title: 'Delete this account?',
        message: 'This erases their personal data, reports and photos, and anonymizes their claims on other people’s reports. It cannot be undone.',
        confirmText: 'Delete account',
        destructive: true,
        requireText: user.email,
        requireTextLabel: `Type ${user.email} to confirm`,
        run: () => this.userApi.deleteUser(user.id),
        doneMessage: 'Account deleted',
      })
      .pipe(tap(() => this.router.navigate(['/users'])))
      .subscribe();
  }

  protected copy(value: string, label: string): void {
    navigator.clipboard
      .writeText(value)
      .then(() => this.toastService.info(`${label} copied`))
      .catch(() => this.toastService.error('Could not copy to the clipboard'));
  }

  private runAndRefresh(action: ModerationAction): void {
    this.moderation
      .confirm(action)
      .pipe(
        tap(() => {
          this.user.reload();
          this.reports.reload();
          this.claims.reload();
          this.complaints()?.reload();
          this.history()?.reload();
        }),
      )
      .subscribe();
  }
}
