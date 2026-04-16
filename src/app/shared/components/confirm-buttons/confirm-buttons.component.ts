import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-buttons',
  templateUrl: './confirm-buttons.component.html',
  styleUrl: './confirm-buttons.component.scss',
})
export class ConfirmButtonsComponent {
  @HostBinding('class') class = 'w-100';

  @Input() smallButtons = false;
  @Input() marginTop = true;
  @Input() marginBottom = false;
  @Input() justifyContentStart = false;
  @Input() saveButtonTypeSubmit = false;

  @Input() showSaveButton = true;
  @Input() showCancelButton = true;
  @Input() showDeleteButton = false;

  @Input() saveButtonDisabled = false;
  @Input() cancelButtonDisabled = false;
  @Input() deleteButtonDisabled = false;

  @Input() saveButtonText = 'Save';
  @Input() cancelButtonText = 'Cancel';
  @Input() deleteButtonText = 'Delete';

  @Output() editButtonsSave = new EventEmitter<void>();
  @Output() editButtonsCancel = new EventEmitter<void>();
  @Output() editButtonsDelete = new EventEmitter<void>();

  emitSave(): void {
    this.editButtonsSave.emit();
  }

  emitCancel(): void {
    this.editButtonsCancel.emit();
  }

  emitDelete(): void {
    this.editButtonsDelete.emit();
  }
}
