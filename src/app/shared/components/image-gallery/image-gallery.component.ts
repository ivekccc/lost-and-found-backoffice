import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  HostListener,
  input,
  signal,
  viewChild,
} from '@angular/core';

export interface GalleryImage {
  id: number | string;
  imageUrl: string;
  alt?: string;
}

@Component({
  selector: 'app-image-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './image-gallery.component.html',
  styleUrl: './image-gallery.component.scss',
})
export class ImageGalleryComponent {
  images = input.required<ReadonlyArray<GalleryImage>>();

  activeIndex = signal(0);
  isFullscreen = signal(false);

  activeImage = computed(() => this.images()[this.activeIndex()] ?? null);
  hasMultiple = computed(() => this.images().length > 1);

  private thumbStrip = viewChild<ElementRef<HTMLDivElement>>('thumbStrip');

  constructor() {
    effect((onCleanup) => {
      if (!this.isFullscreen()) return;
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      onCleanup(() => {
        document.body.style.overflow = previousOverflow;
      });
    });
  }

  select(index: number): void {
    const length = this.images().length;
    if (length === 0) return;
    const normalized = ((index % length) + length) % length;
    this.activeIndex.set(normalized);
    queueMicrotask(() => this._scrollActiveIntoView());
  }

  next(): void {
    this.select(this.activeIndex() + 1);
  }

  previous(): void {
    this.select(this.activeIndex() - 1);
  }

  openFullscreen(): void {
    this.isFullscreen.set(true);
  }

  closeFullscreen(): void {
    this.isFullscreen.set(false);
  }

  @HostListener('window:keydown', ['$event'])
  handleKeydown(event: KeyboardEvent): void {
    if (!this.isFullscreen()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.closeFullscreen();
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      this.next();
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      this.previous();
    }
  }

  private _scrollActiveIntoView(): void {
    const strip = this.thumbStrip()?.nativeElement;
    if (!strip) return;
    const element = strip.children[this.activeIndex()] as HTMLElement | undefined;
    element?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }
}
