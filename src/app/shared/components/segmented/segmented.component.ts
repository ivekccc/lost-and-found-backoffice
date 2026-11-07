import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SegmentOption {
  value: string;
  label: string;
  count?: number | null;
}

@Component({
  selector: 'app-segmented',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="segmented" role="radiogroup" [attr.aria-label]="label()">
      @for (option of options(); track option.value) {
        <button
          type="button"
          role="radio"
          class="segmented__option"
          [class.segmented__option--active]="option.value === value()"
          [attr.aria-checked]="option.value === value()"
          [attr.tabindex]="option.value === value() ? 0 : -1"
          (click)="change.emit(option.value)"
          (keydown.arrowRight)="move($event, 1)"
          (keydown.arrowDown)="move($event, 1)"
          (keydown.arrowLeft)="move($event, -1)"
          (keydown.arrowUp)="move($event, -1)"
          (keydown.home)="jump($event, 0)"
          (keydown.end)="jump($event, options().length - 1)"
        >
          {{ option.label }}
          @if (option.count) {
            <span class="segmented__count tabular">{{ option.count }}</span>
          }
        </button>
      }
    </div>
  `,
  styles: `
    .segmented {
      display: inline-flex;
      gap: 2px;
      padding: 2px;
      background-color: var(--app-surface-subtle);
      border: 1px solid var(--app-border);
      border-radius: var(--app-radius);
    }

    .segmented__option {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 26px;
      padding: 0 10px;
      font-size: var(--app-text-sm);
      font-weight: 500;
      color: var(--app-text-secondary);
      background: none;
      border: none;
      border-radius: var(--app-radius-sm);
      transition: background-color var(--app-duration-instant) var(--app-ease-out), color var(--app-duration-instant) var(--app-ease-out);

      &:hover {
        color: var(--app-text);
      }

      &--active,
      &--active:hover {
        color: var(--app-text);
        background-color: var(--app-surface);
        box-shadow: 0 0 0 1px var(--app-border);
      }
    }

    .segmented__count {
      font-size: var(--app-text-xs);
      color: var(--app-text-muted);
    }
  `,
})
export class SegmentedComponent {
  readonly options = input.required<SegmentOption[]>();
  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly change = output<string>();

  protected move(event: Event, step: number): void {
    const options = this.options();
    const index = options.findIndex((option) => option.value === this.value());
    this.jump(event, (index + step + options.length) % options.length);
  }

  protected jump(event: Event, index: number): void {
    event.preventDefault();
    const buttons = (event.target as HTMLElement).parentElement?.querySelectorAll<HTMLButtonElement>('[role="radio"]');
    buttons?.[index]?.focus();
    this.change.emit(this.options()[index].value);
  }
}
