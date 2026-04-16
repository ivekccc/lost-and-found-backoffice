import { ChangeDetectionStrategy, Component, Input, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmModalInitialState } from './confirm-modal.interface';

@Component({
  selector: 'app-confirm-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-modal.component.html',
  styleUrl: './confirm-modal.component.scss',
})
export class ConfirmModalComponent implements OnDestroy {
  @Input() data!: ConfirmModalInitialState;

  onClose$: Subject<boolean>;

  constructor(public modalRef: BsModalRef) {
    this.onClose$ = new Subject();
  }

  ngOnDestroy(): void {
    this.onClose$.complete();
  }

  confirm(): void {
    this.onClose$.next(true);
    this.modalRef.hide();
  }

  cancel(): void {
    this.onClose$.next(false);
    this.modalRef.hide();
  }
}
