import {
  AbuseReason,
  AbuseReportStatus,
  AbuseTargetType,
  ClaimStatus,
  ReportMatchStatus,
  ReportStatus,
  ReportType,
  UserRole,
  UserStatus,
} from '@lost-and-found/api';

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export interface StatusPresentation {
  label: string;
  tone: StatusTone;
}

export const REPORT_STATUS: Record<ReportStatus, StatusPresentation> = {
  [ReportStatus.ACTIVE]: { label: 'Active', tone: 'success' },
  [ReportStatus.MATCHED]: { label: 'Matched', tone: 'info' },
  [ReportStatus.CLOSED]: { label: 'Closed', tone: 'neutral' },
  [ReportStatus.RESOLVED]: { label: 'Reunited', tone: 'accent' },
  [ReportStatus.EXPIRED]: { label: 'Expired', tone: 'neutral' },
  [ReportStatus.FLAGGED]: { label: 'Hidden', tone: 'danger' },
  [ReportStatus.DELETED]: { label: 'Deleted', tone: 'neutral' },
};

export const REPORT_TYPE: Record<ReportType, StatusPresentation> = {
  [ReportType.LOST]: { label: 'Lost', tone: 'warning' },
  [ReportType.FOUND]: { label: 'Found', tone: 'info' },
};

export const USER_STATUS: Record<UserStatus, StatusPresentation> = {
  [UserStatus.ACTIVE]: { label: 'Active', tone: 'success' },
  [UserStatus.PARTIALLY_BLOCKED]: { label: 'Restricted', tone: 'warning' },
  [UserStatus.BLOCKED]: { label: 'Blocked', tone: 'danger' },
  [UserStatus.DELETED]: { label: 'Deleted', tone: 'neutral' },
};

export const USER_ROLE: Record<UserRole, StatusPresentation> = {
  [UserRole.USER]: { label: 'User', tone: 'neutral' },
  [UserRole.ADMIN]: { label: 'Admin', tone: 'accent' },
  [UserRole.COORDINATOR]: { label: 'Coordinator', tone: 'info' },
};

export const ABUSE_STATUS: Record<AbuseReportStatus, StatusPresentation> = {
  [AbuseReportStatus.PENDING]: { label: 'Pending', tone: 'warning' },
  [AbuseReportStatus.REVIEWED_ACTIONED]: { label: 'Actioned', tone: 'success' },
  [AbuseReportStatus.DISMISSED]: { label: 'Dismissed', tone: 'neutral' },
};

export const ABUSE_REASON: Record<AbuseReason, string> = {
  [AbuseReason.SCAM]: 'Scam',
  [AbuseReason.SPAM]: 'Spam',
  [AbuseReason.OFFENSIVE]: 'Offensive',
  [AbuseReason.PERSONAL_INFO]: 'Personal information',
  [AbuseReason.WRONG_CATEGORY]: 'Wrong category',
  [AbuseReason.OTHER]: 'Other',
};

export const ABUSE_TARGET: Record<AbuseTargetType, string> = {
  [AbuseTargetType.REPORT]: 'Report',
  [AbuseTargetType.USER]: 'User',
  [AbuseTargetType.MESSAGE]: 'Message',
};

export const CLAIM_STATUS: Record<ClaimStatus, StatusPresentation> = {
  [ClaimStatus.PENDING]: { label: 'Pending', tone: 'warning' },
  [ClaimStatus.APPROVED]: { label: 'Approved', tone: 'success' },
  [ClaimStatus.DECLINED]: { label: 'Declined', tone: 'danger' },
  [ClaimStatus.WITHDRAWN]: { label: 'Withdrawn', tone: 'neutral' },
};

export const MATCH_STATUS: Record<ReportMatchStatus, StatusPresentation> = {
  [ReportMatchStatus.SUGGESTED]: { label: 'Suggested', tone: 'info' },
};

export function enumOptions<T extends string>(map: Record<T, StatusPresentation | string>): { value: T; label: string }[] {
  return (Object.keys(map) as T[]).map((value) => {
    const entry = map[value];
    return { value, label: typeof entry === 'string' ? entry : entry.label };
  });
}
