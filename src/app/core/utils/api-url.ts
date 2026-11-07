import { environment } from '../../../environments/environment';

const apiBase = new URL(environment.apiUrl);

function parse(url: string): URL | null {
  try {
    return new URL(url, window.location.origin);
  } catch {
    return null;
  }
}

export function isApiRequest(url: string): boolean {
  const target = parse(url);
  return !!target && target.origin === apiBase.origin && target.pathname.startsWith(apiBase.pathname);
}

export function apiPath(url: string): string {
  const target = parse(url);
  if (!target) {
    return '';
  }
  const basePath = apiBase.pathname.replace(/\/$/, '');
  return target.pathname.startsWith(basePath) ? target.pathname.slice(basePath.length) : target.pathname;
}
