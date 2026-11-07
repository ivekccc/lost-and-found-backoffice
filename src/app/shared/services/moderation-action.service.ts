import { Injectable, inject, signal } from '@angular/core';
import { EMPTY, Observable, catchError, filter, finalize, map, switchMap, tap } from 'rxjs';
import { ConfirmModalService } from './confirm-modal.service';
import { ToastService } from './toast.service';
import { ConfirmModalInitialState } from '../components/confirm-modal/confirm-modal.interface';

export interface ModerationAction {
  title: string;
  message: string;
  confirmText: string;
  destructive?: boolean;
  requireText?: string;
  requireTextLabel?: string;
  run: () => Observable<void>;
  doneMessage: string;
}

@Injectable({ providedIn: 'root' })
export class ModerationActionService {
  private readonly confirmModal = inject(ConfirmModalService);
  private readonly toastService = inject(ToastService);

  readonly working = signal(false);

  confirm(action: ModerationAction): Observable<void> {
    const options: Partial<ConfirmModalInitialState> = {
      title: action.title,
      confirmText: action.confirmText,
      destructive: action.destructive ?? false,
      requireText: action.requireText,
      requireTextLabel: action.requireTextLabel,
    };
    return this.confirmModal.openConfirm(action.message, options).pipe(
      filter((confirmed) => confirmed),
      tap(() => this.working.set(true)),
      switchMap(() => action.run().pipe(finalize(() => this.working.set(false)))),
      tap(() => this.toastService.success(action.doneMessage)),
      map(() => undefined),
      catchError(() => EMPTY),
    );
  }
}
