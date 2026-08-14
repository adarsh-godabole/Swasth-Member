import { useQueryClient } from '@tanstack/react-query';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { ApiError, refreshSession, setSessionExpiredHandler } from '../api/client';
import { authApi } from '../api/endpoints';
import { clearTokens, getRefreshToken, saveTokens } from '../api/tokens';
import type { AuthSession } from '../api/types';

type Status = 'restoring' | 'signedIn' | 'signedOut';

type AuthContextValue = {
  status: Status;
  /** Snapshot from login/refresh. The source of truth for profile data is GET /users/me. */
  user: AuthSession['user'] | null;
  signIn: (session: AuthSession) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('restoring');
  const [user, setUser] = useState<AuthSession['user'] | null>(null);
  const queryClient = useQueryClient();

  const signIn = useCallback(async (session: AuthSession) => {
    await saveTokens(session);
    setUser(session.user);
    setStatus('signedIn');
  }, []);

  const signOut = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    if (refreshToken) {
      // Best effort — local tokens are cleared regardless of the response.
      try {
        await authApi.logout(refreshToken);
      } catch {}
    }
    await clearTokens();
    setUser(null);
    setStatus('signedOut');
    queryClient.clear();
  }, [queryClient]);

  // Silent restore on cold start: a returning member never sees the login screen.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      try {
        const pair = await refreshSession();
        if (!cancelled) setStatus(pair ? 'signedIn' : 'signedOut');
      } catch (err) {
        // Offline is not "logged out" — keep the session and let screens retry.
        const offline = err instanceof ApiError && err.isNetwork;
        if (!cancelled) setStatus(offline ? 'signedIn' : 'signedOut');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // The API client calls this when a refresh fails irrecoverably.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setUser(null);
      setStatus('signedOut');
      queryClient.clear();
    });
    return () => setSessionExpiredHandler(null);
  }, [queryClient]);

  const value = useMemo(
    () => ({ status, user, signIn, signOut }),
    [status, user, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
