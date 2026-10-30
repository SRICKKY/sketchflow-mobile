import type {
  AuthResponse,
  BoardPage,
  BoardScope,
  BoardSummary,
  DashboardResponse,
  SessionResponse,
} from './types';

export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL?.trim() || 'https://backend.sketchflow.online'
).replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    body:
      options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const responseText = await response.text();
  let payload: unknown;

  try {
    payload = responseText.length === 0 ? null : JSON.parse(responseText);
  } catch {
    throw new ApiError(`The server returned an invalid response (${response.status}).`, response.status);
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' &&
      payload !== null &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  return payload as T;
}

export const api = {
  getSession: () => request<SessionResponse>('/api/auth/session'),

  login: (email: string, password: string) =>
    request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  register: (name: string, email: string, password: string) =>
    request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: { name, email, password },
    }),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', {
      method: 'POST',
    }),

  getDashboard: () => request<DashboardResponse>('/api/dashboard'),

  listBoards: (
    scope: BoardScope,
    query = '',
    cursor: string | null = null,
  ) => {
    const params = new URLSearchParams({ scope, limit: '100' });
    if (query.trim()) {
      params.set('q', query.trim());
    }
    if (cursor) {
      params.set('cursor', cursor);
    }
    return request<BoardPage>(`/api/boards?${params.toString()}`);
  },

  createBoard: (name: string) =>
    request<BoardSummary>('/api/boards', {
      method: 'POST',
      body: { name },
    }),
};
