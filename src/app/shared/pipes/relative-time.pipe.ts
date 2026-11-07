import { Pipe, PipeTransform } from '@angular/core';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

@Pipe({ name: 'relativeTime' })
export class RelativeTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) {
      return '—';
    }
    const date = typeof value === 'string' ? new Date(value) : value;
    const seconds = (date.getTime() - Date.now()) / 1000;
    for (const [unit, unitSeconds] of UNITS) {
      if (Math.abs(seconds) >= unitSeconds) {
        return formatter.format(Math.round(seconds / unitSeconds), unit);
      }
    }
    return 'just now';
  }
}
