import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AdminMatchDetailsDto } from '@lost-and-found/api';

/**
 * Shows how a match got its score, following the three scoring components of the matching engine.
 *
 * The stored points are the truth; the formulas are the explanation printed beside them. Nothing
 * here recomputes the score — the parameters come from the match row, recorded when it was scored,
 * so a retuned engine cannot make an old match explain itself with the wrong weights.
 */
@Component({
  selector: 'app-match-details-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, RouterLink],
  templateUrl: './match-details-modal.component.html',
  styleUrl: './match-details-modal.component.scss',
})
export class MatchDetailsModalComponent {
  @Input() data!: AdminMatchDetailsDto;

  constructor(public modalRef: BsModalRef) {}

  /** d capped at dmax, as the spatial formula uses it. */
  get cappedDistanceKm(): number {
    return Math.min(this.data.distanceKm, this.data.config.maxDistanceKm);
  }

  /** The 1 − min(d, dmax)/dmax factor, before the weight. */
  get distanceFactor(): number {
    return 1 - this.cappedDistanceKm / this.data.config.maxDistanceKm;
  }

  /** The max(0, 1 − Δt/τ) factor, before the weight. */
  get timeFactor(): number {
    return Math.max(0, 1 - this.data.timeGapDays / this.data.config.timeDecayDays);
  }

  get meetsThreshold(): boolean {
    return this.data.score >= this.data.config.scoreThreshold;
  }

  close(): void {
    this.modalRef.hide();
  }
}
