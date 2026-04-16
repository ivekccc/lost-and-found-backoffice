import { Injectable } from '@angular/core';
import { UserProfileDto } from '@lost-and-found/api';
import { createSignalStore } from './shared/utils/create-signal-store';

interface AppState {
  user: UserProfileDto | null;
}

const INITIAL_STATE: AppState = {
  user: null,
};

@Injectable({ providedIn: 'root' })
export class AppStore {
  private readonly _store = createSignalStore<AppState>(INITIAL_STATE);

  readonly state = this._store.store;

  setState(updates: Partial<AppState>) {
    this._store.update(updates);
  }
}
