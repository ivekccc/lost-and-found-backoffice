import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ActivityDayDto, CityOverviewDto, QueueCountsDto } from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly api = inject(ApiService);

  getQueues(): Observable<QueueCountsDto> {
    return this.api.get<QueueCountsDto>('admin/dashboard/queues');
  }

  getActivity(days: number): Observable<ActivityDayDto[]> {
    return this.api.get<ActivityDayDto[]>('admin/dashboard/activity', new HttpParams().set('days', days));
  }

  getCities(days: number): Observable<CityOverviewDto[]> {
    return this.api.get<CityOverviewDto[]>('admin/dashboard/cities', new HttpParams().set('days', days));
  }
}
