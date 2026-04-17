import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-error-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './error-state.component.html',
  styleUrl: './error-state.component.scss',
})
export class ErrorStateComponent {
  @Input() title = 'Something went wrong';
  @Input() message = 'Unable to load data. Please try again.';
  @Input() showRetry = true;
  @Input() retryText = 'Try again';
  @Input() icon = 'fa-triangle-exclamation';

  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }
}
