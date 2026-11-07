import { AuditAction, AuditEntryDto, AuditTargetType } from '@lost-and-found/api';

export const AUDIT_ACTION: Record<AuditAction, string> = {
  [AuditAction.REPORT_HIDDEN]: 'Report hidden',
  [AuditAction.REPORT_RESTORED]: 'Report restored',
  [AuditAction.USER_BLOCKED]: 'User blocked',
  [AuditAction.USER_RESTRICTED]: 'User restricted',
  [AuditAction.USER_UNBLOCKED]: 'Restrictions lifted',
  [AuditAction.USER_DELETED]: 'Account deleted',
  [AuditAction.USER_SESSIONS_REVOKED]: 'Signed out everywhere',
  [AuditAction.ABUSE_REPORT_DISMISSED]: 'Abuse report dismissed',
  [AuditAction.CATEGORY_MIN_QUESTIONS_CHANGED]: 'Minimum questions changed',
  [AuditAction.CATEGORY_IMAGE_CHANGED]: 'Category image changed',
  [AuditAction.QUESTION_TEMPLATE_CREATED]: 'Question added',
  [AuditAction.QUESTION_TEMPLATE_UPDATED]: 'Question edited',
  [AuditAction.QUESTION_TEMPLATE_DEACTIVATED]: 'Question deactivated',
  [AuditAction.MATCHING_CONFIG_UPDATED]: 'Matching updated',
};

export const AUDIT_TARGET: Record<AuditTargetType, string> = {
  [AuditTargetType.REPORT]: 'Report',
  [AuditTargetType.USER]: 'User',
  [AuditTargetType.ABUSE_REPORT]: 'Abuse report',
  [AuditTargetType.CATEGORY]: 'Category',
  [AuditTargetType.QUESTION_TEMPLATE]: 'Question',
  [AuditTargetType.MATCHING_CONFIG]: 'Matching',
};

export function auditTargetLink(entry: Pick<AuditEntryDto, 'targetType' | 'targetId' | 'action'>): unknown[] | null {
  if (entry.action === AuditAction.USER_DELETED) {
    return null;
  }
  switch (entry.targetType) {
    case AuditTargetType.REPORT:
      return entry.targetId == null ? null : ['/reports', entry.targetId];
    case AuditTargetType.USER:
      return entry.targetId == null ? null : ['/users', entry.targetId];
    case AuditTargetType.CATEGORY:
      return ['/definitions'];
    case AuditTargetType.QUESTION_TEMPLATE:
      return ['/definitions'];
    case AuditTargetType.MATCHING_CONFIG:
      return ['/definitions'];
    default:
      return null;
  }
}
