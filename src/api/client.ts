import { API_BASE_URL, GYM_CODE } from '../config';
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
  setAccessToken,
} from './tokens';
import type { ApiFailure, TokenPair } from './types';

/**
 * Every error the app shows a member comes through here. `message` is the
 * backend's own wording — it is written for humans and is shown as-is.
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: string[];
  /** true when the request never reached the server (airplane mode, DNS, timeout). */
  isNetwork: boolean;

  constructor(
    message: string,
    statusCode: number,
    options: { errors?: string[]; isNetwork?: boolean } = {},
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = options.errors;
    this.isNetwork = options.isNetwork ?? false;
  }
}

export type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  /** Skip the Authorization header (login endpoints) and the 401-refresh dance. */
  auth?: boolean;
  /** Skip X-Gym-Code (only /auth/refresh). */
  gymHeader?: boolean;
  signal?: AbortSignal;
  /**
   * The backend sleeps on a free tier: a cold start is 30-60s. Timeouts are
   * generous on purpose — a short one turns a waking server into a failure.
   */
  timeoutMs?: number;
};

const DEFAULT_TIMEOUT_MS = 90_000;

/** Fired when a cold start is suspected, so screens can say "waking up the gym's server…". */
const slowListeners = new Set<(slow: boolean) => void>();
let inFlightSlow = 0;

export function onSlowRequest(listener: (slow: boolean) => void) {
  slowListeners.add(listener);
  return () => slowListeners.delete(listener);
}

function emitSlow(slow: boolean) {
  inFlightSlow = Math.max(0, inFlightSlow + (slow ? 1 : -1));
  const active = inFlightSlow > 0;
  slowListeners.forEach((l) => l(active));
}

/** Called when the session is unrecoverable (refresh failed / token reused). */
let onSessionExpired: (() => void) | null = null;
export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

async function rawFetch(path: string, options: RequestOptions): Promise<Response> {
  const {
    method = 'GET',
    body,
    auth = true,
    gymHeader = true,
    signal,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (gymHeader) headers['X-Gym-Code'] = GYM_CODE;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort);
  const timeout = setTimeout(abort, timeoutMs);

  // If the request is still running after 5s, assume the server is waking up.
  let slowFlagged = false;
  const slowTimer = setTimeout(() => {
    slowFlagged = true;
    emitSlow(true);
  }, 5_000);

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (err) {
    if (signal?.aborted) throw err;
    throw new ApiError(
      "Can't reach the gym's server. Check your connection and try again.",
      0,
      { isNetwork: true },
    );
  } finally {
    clearTimeout(timeout);
    clearTimeout(slowTimer);
    if (slowFlagged) emitSlow(false);
    signal?.removeEventListener('abort', abort);
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;

  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    if (res.ok) return undefined as T;
    throw new ApiError('Something went wrong. Please try again.', res.status);
  }

  const envelope = payload as { success?: boolean; data?: T } & ApiFailure;
  if (res.ok && envelope?.success) return envelope.data as T;

  throw new ApiError(
    envelope?.message ?? 'Something went wrong. Please try again.',
    envelope?.statusCode ?? res.status,
    { errors: envelope?.errors },
  );
}

/**
 * Single-flight refresh. Refresh tokens rotate on every use and reusing a
 * rotated one makes the backend kill the session as suspected theft — so
 * concurrent 401s (several screens refetching after backgrounding) all wait on
 * one refresh instead of each firing their own.
 */
let refreshInFlight: Promise<TokenPair | null> | null = null;

export function refreshSession(): Promise<TokenPair | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await getRefreshToken();
    if (!refreshToken) return null;

    try {
      const res = await rawFetch('/auth/refresh', {
        method: 'POST',
        body: { refreshToken },
        auth: false,
        gymHeader: false,
      });
      const pair = await parse<TokenPair>(res);
      // Always store BOTH tokens — the refresh token rotated.
      await saveTokens(pair);
      return pair;
    } catch (err) {
      if (err instanceof ApiError && err.isNetwork) throw err; // offline ≠ logged out
      await clearTokens();
      setAccessToken(null);
      onSessionExpired?.();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const res = await rawFetch(path, options);

  if (res.status !== 401 || options.auth === false) return parse<T>(res);

  const pair = await refreshSession();
  if (!pair) return parse<T>(res); // no session to recover — surface the 401 message

  const retry = await rawFetch(path, options);
  return parse<T>(retry);
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE', body }),
};
