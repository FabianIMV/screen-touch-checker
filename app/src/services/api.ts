/**
 * API Service — thin HTTP layer.
 *
 * Architecture note:
 *   - Today: all data is stored locally in SQLite (see database.ts).
 *   - Future: swap BASE_URL to point at the Express/AWS Lambda endpoint.
 *   - Auth: stub for JWT bearer; ready to swap to AWS Cognito tokens.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!BASE_URL) {
    throw new Error('API_NOT_CONFIGURED');
  }

  const { method = 'GET', body, token } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errorText}`);
  }

  return res.json() as Promise<T>;
}

// ─── Session Sync ─────────────────────────────────────────────────────────────
// These will be called when the device has connectivity and a backend is live.

export const sessionApi = {
  upload: (session: unknown, token?: string) =>
    request('/sessions', { method: 'POST', body: session, token }),

  list: (token?: string) =>
    request('/sessions', { token }),

  get: (id: string, token?: string) =>
    request(`/sessions/${id}`, { token }),
};
