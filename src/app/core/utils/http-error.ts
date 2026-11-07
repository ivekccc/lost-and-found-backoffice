import { HttpErrorResponse } from '@angular/common/http';

export interface DescribedError {
  title: string;
  detail?: string;
  offline: boolean;
}

export function describeHttpError(error: unknown): DescribedError {
  if (!(error instanceof HttpErrorResponse)) {
    return { title: 'Something went wrong', detail: 'Try again in a moment.', offline: false };
  }
  if (error.status === 0) {
    return { title: 'Cannot reach the server', detail: 'Check your connection and try again.', offline: true };
  }
  const serverMessage = typeof error.error?.message === 'string' ? error.error.message : undefined;
  if (error.status === 403) {
    return { title: 'Not allowed', detail: serverMessage ?? 'Your account cannot perform this action.', offline: false };
  }
  if (error.status === 404) {
    return { title: 'Not found', detail: serverMessage ?? 'It may have been deleted.', offline: false };
  }
  if (error.status === 429) {
    return { title: 'Too many requests', detail: serverMessage ?? 'Wait a moment and try again.', offline: false };
  }
  if (error.status >= 500) {
    return { title: 'Server error', detail: 'The action was not completed. Try again in a moment.', offline: false };
  }
  return { title: serverMessage ?? 'Request failed', offline: false };
}
