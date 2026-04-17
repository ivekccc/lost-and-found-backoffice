import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-details-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './details-skeleton.component.html',
  styleUrl: './details-skeleton.component.scss',
})
export class DetailsSkeletonComponent {}
