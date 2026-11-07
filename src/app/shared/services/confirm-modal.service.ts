import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { BsModalService } from 'ngx-bootstrap/modal';
import { ConfirmModalComponent } from '../components/confirm-modal/confirm-modal.component';
import { ConfirmModalInitialState } from '../components/confirm-modal/confirm-modal.interface';

@Injectable({ providedIn: 'root' })
export class ConfirmModalService {
  constructor(private modalService: BsModalService) {}

  openConfirm(messageContent: string, config?: Partial<ConfirmModalInitialState>): Observable<boolean> {
    const modalRef = this.modalService.show(ConfirmModalComponent, {
      class: 'bo-modal-confirm modal-dialog-centered',
      ariaLabelledBy: 'confirm-title',
      keyboard: true,
      initialState: {
        data: {
          messageContent,
          title: '',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          destructive: false,
          ...config,
        },
      },
    });

    return modalRef.content!.onClose$.pipe(take(1));
  }
}
