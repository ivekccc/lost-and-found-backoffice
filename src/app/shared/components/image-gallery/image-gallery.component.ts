import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { GalleryItem, GalleryModule, ImageItem } from 'ng-gallery';
import { Lightbox } from 'ng-gallery/lightbox';

export interface GalleryImage {
  id: number | string;
  imageUrl: string;
  alt?: string;
}

let galleryIdCounter = 0;

@Component({
  selector: 'app-image-gallery',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GalleryModule],
  templateUrl: './image-gallery.component.html',
  styleUrl: './image-gallery.component.scss',
})
export class ImageGalleryComponent {
  private lightbox = inject(Lightbox);

  readonly galleryId = `report-gallery-${++galleryIdCounter}`;

  images = input.required<ReadonlyArray<GalleryImage>>();

  items = computed<GalleryItem[]>(() =>
    this.images().map(
      (image) => new ImageItem({ src: image.imageUrl, thumb: image.imageUrl }),
    ),
  );

  openLightbox(index: number): void {
    this.lightbox.open(index, this.galleryId, { panelClass: 'fullscreen' });
  }
}
