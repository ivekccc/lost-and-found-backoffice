import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import type { Map as MapLibreMap, Marker } from 'maplibre-gl';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const MAP_STYLESHEET = 'maplibre.css';
const MAP_WORKER = 'maplibre/maplibre-gl-worker.mjs';

function loadStylesheet(document: Document): Promise<void> {
  const existing = document.querySelector<HTMLLinkElement>(`link[href="${MAP_STYLESHEET}"]`);
  if (existing) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = MAP_STYLESHEET;
    link.onload = () => resolve();
    link.onerror = () => reject(new Error('Map stylesheet failed to load'));
    document.head.appendChild(link);
  });
}

@Component({
  selector: 'app-map-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './map-view.component.html',
  styleUrl: './map-view.component.scss',
})
export class MapViewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef<HTMLDivElement>;

  @Input() latitude = 0;
  @Input() longitude = 0;
  @Input() zoom = 14;
  @Input() markerColor = '#F54927';

  private readonly document = inject(DOCUMENT);
  protected readonly failed = signal(false);
  private map: MapLibreMap | null = null;
  private marker: Marker | null = null;
  private destroyed = false;

  ngAfterViewInit(): void {
    void this.initialize();
  }

  protected retry(): void {
    this.failed.set(false);
    void this.initialize();
  }

  private async initialize(): Promise<void> {
    try {
      const [maplibre] = await Promise.all([import('maplibre-gl'), loadStylesheet(this.document)]);
      if (this.destroyed) {
        return;
      }
      maplibre.setWorkerUrl(new URL(MAP_WORKER, this.document.baseURI).href);
      this.map?.remove();
      this.map = new maplibre.Map({
        container: this.mapContainer.nativeElement,
        style: MAP_STYLE,
        center: [this.longitude, this.latitude],
        zoom: this.zoom,
        attributionControl: false,
      });
      this.marker = new maplibre.Marker({ color: this.markerColor })
        .setLngLat([this.longitude, this.latitude])
        .addTo(this.map);
    } catch {
      this.failed.set(true);
    }
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.marker?.remove();
    this.map?.remove();
  }
}
