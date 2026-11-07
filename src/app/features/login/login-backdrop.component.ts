import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Placement {
  key: string;
  icon: string;
  left: number;
  top: number;
  size: number;
  rotation: number;
}

const ICONS = [
  'fa-solid fa-question',
  'fa-solid fa-key',
  'fa-solid fa-money-bill',
  'fa-solid fa-mobile-screen',
  'fa-solid fa-umbrella',
  'fa-solid fa-suitcase',
  'fa-solid fa-paw',
  'fa-solid fa-magnifying-glass',
  'fa-solid fa-location-dot',
  'fa-regular fa-circle-question',
  'fa-solid fa-credit-card',
  'fa-solid fa-eye',
  'fa-solid fa-briefcase',
  'fa-solid fa-headphones',
  'fa-solid fa-gift',
  'fa-solid fa-bicycle',
  'fa-regular fa-id-card',
  'fa-regular fa-heart',
];

const CELL_SIZE = 76;
const MIN_ICON_SIZE = 18;
const MAX_ICON_SIZE = 32;
const AREA_WIDTH = 1600;
const AREA_HEIGHT = 1400;
const SEED = 20261106;

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function layout(width: number, height: number): Placement[] {
  const random = seededRandom(SEED);
  const columns = Math.ceil(width / CELL_SIZE) + 1;
  const rows = Math.ceil(height / CELL_SIZE) + 1;
  const placements: Placement[] = [];
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const offset = row % 2 === 0 ? 0 : CELL_SIZE / 2;
      placements.push({
        key: `${row}-${column}`,
        icon: ICONS[Math.floor(random() * ICONS.length)],
        left: column * CELL_SIZE + offset + (random() - 0.5) * CELL_SIZE * 0.5 - CELL_SIZE / 2,
        top: row * CELL_SIZE + (random() - 0.5) * CELL_SIZE * 0.5,
        size: MIN_ICON_SIZE + random() * (MAX_ICON_SIZE - MIN_ICON_SIZE),
        rotation: Math.round((random() - 0.5) * 120),
      });
    }
  }
  return placements;
}

const PLACEMENTS = layout(AREA_WIDTH, AREA_HEIGHT);

@Component({
  selector: 'app-login-backdrop',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (placement of placements; track placement.key) {
      <i
        [class]="placement.icon"
        [style.left.px]="placement.left"
        [style.top.px]="placement.top"
        [style.font-size.px]="placement.size"
        [style.transform]="'rotate(' + placement.rotation + 'deg)'"
      ></i>
    }
  `,
  styles: `
    :host {
      position: absolute;
      inset: 0;
      overflow: hidden;
      color: var(--app-text);
      opacity: 0.07;
      pointer-events: none;
    }

    :host-context([data-bs-theme='dark']) {
      opacity: 0.06;
    }

    i {
      position: absolute;
      line-height: 1;
    }
  `,
  host: { 'aria-hidden': 'true' },
})
export class LoginBackdropComponent {
  protected readonly placements = PLACEMENTS;
}
