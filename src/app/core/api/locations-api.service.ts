import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AutoCompleteSuggestionDto } from '@lost-and-found/api';
import { HttpParams } from '@angular/common/http';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class LocationsApiService {
  constructor(private api: ApiService) {}

  // Server ogranicava predloge na grad koji ulogovani nalog trenutno pretrazuje, pa se grad
  // ne salje kao parametar niti se adresa van tog grada moze ponuditi.
  autocomplete(query: string): Observable<AutoCompleteSuggestionDto[]> {
    return this.api.get<AutoCompleteSuggestionDto[]>(
      'locations/autocomplete',
      new HttpParams().append('query', query),
    );
  }
}
