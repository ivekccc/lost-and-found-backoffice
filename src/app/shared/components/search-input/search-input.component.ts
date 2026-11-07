import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, effect, inject, input, output, signal, untracked, viewChild } from '@angular/core';

const DEBOUNCE_MS = 250;

@Component({
  selector: 'app-search-input',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="search">
      <i class="fa-solid fa-magnifying-glass search__icon" aria-hidden="true"></i>
      <input
        #field
        class="form-control search__input"
        type="search"
        [attr.aria-label]="label()"
        [placeholder]="placeholder()"
        [value]="draft()"
        (input)="onInput($any($event.target).value)"
        (keydown.escape)="clear()"
      />
      @if (draft()) {
        <button type="button" class="btn btn-ghost btn-sm btn-icon search__clear" aria-label="Clear search" (click)="clear()">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      } @else {
        <kbd class="kbd search__hint" aria-hidden="true">/</kbd>
      }
    </div>
  `,
  styles: `
    .search {
      position: relative;
      width: min(340px, 100%);
    }

    .search__icon {
      position: absolute;
      top: 50%;
      left: 10px;
      font-size: 12px;
      color: var(--app-text-muted);
      transform: translateY(-50%);
      pointer-events: none;
    }

    .search__input {
      padding-left: 30px;
      padding-right: 34px;

      &::-webkit-search-cancel-button {
        display: none;
      }
    }

    .search__clear,
    .search__hint {
      position: absolute;
      top: 50%;
      right: 4px;
      transform: translateY(-50%);
    }

    .search__hint {
      right: 8px;
    }
  `,
})
export class SearchInputComponent {
  readonly value = input<string>('');
  readonly placeholder = input('Search');
  readonly label = input('Search');
  readonly search = output<string>();

  protected readonly draft = signal('');
  private readonly field = viewChild.required<ElementRef<HTMLInputElement>>('field');
  private timer: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    effect(() => {
      const value = this.value();
      if (untracked(() => this.draft().trim()) !== value) {
        this.draft.set(value);
      }
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.timer));
  }

  @HostListener('document:keydown', ['$event'])
  protected focusOnSlash(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = target && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));
    const overlayOpen = !!document.querySelector('.modal.show, .cdk-overlay-pane [role="dialog"], .cdk-overlay-pane [role="menu"]');
    if (event.key === '/' && !typing && !overlayOpen && !event.metaKey && !event.ctrlKey) {
      event.preventDefault();
      this.field().nativeElement.focus();
    }
  }

  protected onInput(value: string): void {
    this.draft.set(value);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.search.emit(value.trim()), DEBOUNCE_MS);
  }

  protected clear(): void {
    clearTimeout(this.timer);
    this.draft.set('');
    this.search.emit('');
  }
}
