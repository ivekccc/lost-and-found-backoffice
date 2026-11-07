import { Observable, of } from 'rxjs';
import { PageLike } from './paged-loader';

export function whenPresent<P, T>(load: (value: P) => Observable<PageLike<T>>): (value: P | null) => Observable<PageLike<T>> {
  return (value) => (value === null ? of({ content: [], totalElements: 0 }) : load(value));
}
