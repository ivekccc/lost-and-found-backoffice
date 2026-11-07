import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivityDayDto } from '@lost-and-found/api';

@Component({
  selector: 'app-activity-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  templateUrl: './activity-chart.component.html',
  styleUrl: './activity-chart.component.scss',
})
export class ActivityChartComponent {
  readonly days = input.required<ActivityDayDto[]>();

  protected readonly max = computed(() => {
    const peak = Math.max(0, ...this.days().map((day) => Math.max(day.reportsPosted, day.reportsReunited)));
    if (peak <= 4) {
      return 4;
    }
    const magnitude = 10 ** Math.floor(Math.log10(peak));
    const rounded = Math.ceil(peak / magnitude) * magnitude;
    return rounded % 2 === 0 ? rounded : rounded + magnitude;
  });
  protected readonly labelDays = computed(() => {
    const days = this.days();
    if (days.length < 3) {
      return new Set(days.map((day) => day.day));
    }
    return new Set([days[0].day, days[Math.floor(days.length / 2)].day, days[days.length - 1].day]);
  });

  protected height(value: number): number {
    return (value / this.max()) * 100;
  }
}
