import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, computed, inject, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { ConfirmModalInitialState } from './confirm-modal.interface';

@Component({
  selector: 'app-confirm-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent implements OnDestroy, AfterViewInit {
  private readonly host = inject(ElementRef<HTMLElement>);
  @Input() data!: ConfirmModalInitialState;

  readonly onClose$ = new Subject<boolean>();
  protected readonly typed = signal('');
  protected readonly matches = computed(() => !this.data?.requireText || this.typed().trim() === this.data.requireText);

  constructor(public modalRef: BsModalRef) {}

  ngAfterViewInit(): void {
    setTimeout(() => this.host.nativeElement.querySelector('#confirm-text')?.focus());
  }

  ngOnDestroy(): void {
    this.onClose$.complete();
  }

  protected confirm(): void {
    if (!this.matches()) {
      return;
    }
    this.onClose$.next(true);
    this.modalRef.hide();
  }

  protected cancel(): void {
    this.onClose$.next(false);
    this.modalRef.hide();
  }
}
