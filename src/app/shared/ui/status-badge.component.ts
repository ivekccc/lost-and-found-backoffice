import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { StatusPresentation } from './status';

@Component({
  selector: 'app-status',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="status" [class]="'status status--' + value().tone">{{ value().label }}</span>`,
})
export class StatusBadgeComponent {
  readonly value = input.required<StatusPresentation>();
}
