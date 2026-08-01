import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CityDto } from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CitiesApiService {
  constructor(private api: ApiService) {}

  getCities(): Observable<CityDto[]> {
    return this.api.get<CityDto[]>('cities');
  }
}
