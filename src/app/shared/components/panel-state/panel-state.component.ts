import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-panel-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (error()) {
      <div class="panel-state" role="alert">
        <span>{{ errorText() }}</span>
        <button type="button" class="btn btn-ghost btn-sm" (click)="retry.emit()">Try again</button>
      </div>
    } @else if (!loaded()) {
      <div class="panel-state"><span class="skeleton skeleton--line"></span></div>
    } @else if (empty()) {
      <p class="panel-state cell-muted">{{ emptyText() }}</p>
    }
  `,
  styles: `
    .panel-state {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--app-space-3);
      margin: 0;
      padding: var(--app-space-3) var(--app-space-4);
    }
  `,
})
export class PanelStateComponent {
  readonly loaded = input.required<boolean>();
  readonly empty = input.required<boolean>();
  readonly error = input<unknown>(null);
  readonly emptyText = input.required<string>();
  readonly errorText = input('Could not load this section.');
  readonly retry = output<void>();
}
