const DEFAULT_WEB_TOKEN = 'andromeda_dev_web_token';

export function getApiToken(): string {
  return localStorage.getItem('andromeda_token') || DEFAULT_WEB_TOKEN;
}

export function withApiAuth(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers || {});
  if (!headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${getApiToken()}`);
  }

  return {
    ...init,
    headers,
  };
}

export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  return fetch(input, withApiAuth(init));
}
