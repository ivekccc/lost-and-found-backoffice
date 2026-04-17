import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Map as MapLibreMap, Marker } from 'maplibre-gl';

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

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

  private map: MapLibreMap | null = null;
  private marker: Marker | null = null;

  ngAfterViewInit(): void {
    this.map = new MapLibreMap({
      container: this.mapContainer.nativeElement,
      style: MAP_STYLE,
      center: [this.longitude, this.latitude],
      zoom: this.zoom,
    });

    this.marker = new Marker({ color: this.markerColor })
      .setLngLat([this.longitude, this.latitude])
      .addTo(this.map);
  }

  ngOnDestroy(): void {
    this.marker?.remove();
    this.map?.remove();
  }
}
