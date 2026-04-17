import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-data-table-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './data-table-skeleton.component.html',
  styleUrl: './data-table-skeleton.component.scss',
})
export class DataTableSkeletonComponent {
  @Input() showHeading = true;
  @Input() showReload = false;
  @Input() showButton = false;
  @Input() columnCount = 5;
  @Input() rowCount = 6;

  get columns(): number[] {
    return Array.from({ length: this.columnCount }, (_, index) => index);
  }

  get rows(): number[] {
    return Array.from({ length: this.rowCount }, (_, index) => index);
  }
}
