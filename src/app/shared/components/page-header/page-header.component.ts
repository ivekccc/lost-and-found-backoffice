import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <header class="page-header">
      <div class="page-header__text">
        @if (backLink(); as link) {
          <a class="page-header__back" [routerLink]="link">
            <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
            {{ backLabel() }}
          </a>
        }
        <div class="page-header__title-row">
          <h1 class="page-header__title">{{ title() }}</h1>
          <ng-content select="[headerMeta]" />
        </div>
        @if (description()) {
          <p class="page-header__description">{{ description() }}</p>
        }
      </div>
      <div class="page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: var(--app-space-3) var(--app-space-5);
      margin-bottom: var(--app-space-5);
    }

    .page-header__text {
      min-width: 0;
    }

    .page-header__back {
      display: inline-flex;
      align-items: center;
      gap: var(--app-space-2);
      margin-bottom: var(--app-space-2);
      font-size: var(--app-text-sm);
      color: var(--app-text-muted);
      text-decoration: none;

      &:hover {
        color: var(--app-text);
      }
    }

    .page-header__title-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--app-space-2) var(--app-space-3);
    }

    .page-header__title {
      margin: 0;
      font-size: var(--app-text-xl);
      font-weight: 600;
      line-height: 1.25;
    }

    .page-header__description {
      margin: var(--app-space-1) 0 0;
      max-width: 70ch;
      color: var(--app-text-secondary);
    }

    .page-header__actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--app-space-2);
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly backLink = input<string | unknown[]>();
  readonly backLabel = input('Back');
}
