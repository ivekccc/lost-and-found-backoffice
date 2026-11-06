import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminConversationDto } from '@lost-and-found/api';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class ConversationsApiService {
  constructor(private api: ApiService) {}

  getConversation(id: number): Observable<AdminConversationDto> {
    return this.api.get<AdminConversationDto>(`admin/conversations/${id}`);
  }
}
