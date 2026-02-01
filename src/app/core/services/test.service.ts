import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class TestService {
  private api = inject(ApiService);

  getSecret(): Observable<string> {
    return this.api.get<string>('/secret');
  }
}
