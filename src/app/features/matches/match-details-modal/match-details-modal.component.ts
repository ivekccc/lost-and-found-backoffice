import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge.component';
import { MATCH_STATUS, REPORT_STATUS } from '../../../shared/ui/status';
import { BsModalRef } from 'ngx-bootstrap/modal';
import { AdminMatchDetailsDto, ReportStatus } from '@lost-and-found/api';

@Component({
  selector: 'app-match-details-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StatusBadgeComponent, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './match-details-modal.component.html',
  styleUrl: './match-details-modal.component.scss',
})
export class MatchDetailsModalComponent {
  protected readonly reportStatus = REPORT_STATUS;
  protected readonly matchStatus = MATCH_STATUS;
  protected readonly activeStatus = ReportStatus.ACTIVE;
  @Input() data!: AdminMatchDetailsDto;

  constructor(public modalRef: BsModalRef) {}

  get cappedDistanceKm(): number {
    return Math.min(this.data.distanceKm, this.data.config.maxDistanceKm);
  }

  get distanceFactor(): number {
    return 1 - this.cappedDistanceKm / this.data.config.maxDistanceKm;
  }

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
