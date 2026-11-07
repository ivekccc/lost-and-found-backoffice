import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';

export interface SelectOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-select',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgSelectModule, FormsModule],
  template: `
    <ng-select
      class="app-select"
      [style.width]="width()"
      [items]="items()"
      bindLabel="label"
      bindValue="value"
      [ngModel]="value() ?? ''"
      (ngModelChange)="valueChange.emit($event ?? '')"
      [searchable]="false"
      [clearable]="false"
      [disabled]="disabled()"
      [ariaLabel]="ariaLabel()"
      [labelForId]="inputId()"
      appendTo="body"
      dropdownPosition="auto"
    >
      <ng-template ng-option-tmp let-item="item" let-selected="item$.selected">
        <span class="app-select__option">
          <span>{{ item.label }}</span>
          @if (selected) {
            <i class="fa-solid fa-check app-select__check" aria-hidden="true"></i>
          }
        </span>
      </ng-template>
    </ng-select>
  `,
})
export class SelectComponent {
  readonly options = input.required<SelectOption[]>();
  readonly value = input<string | null | undefined>('');
  readonly emptyLabel = input<string>();
  readonly ariaLabel = input.required<string>();
  readonly width = input('180px');
  readonly disabled = input(false);
  readonly inputId = input<string>();
  readonly valueChange = output<string>();

  protected readonly items = computed<SelectOption[]>(() => {
    const empty = this.emptyLabel();
    return empty === undefined ? this.options() : [{ value: '', label: empty }, ...this.options()];
  });
}
