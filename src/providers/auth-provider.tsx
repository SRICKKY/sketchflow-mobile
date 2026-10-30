import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { api } from '@/lib/api/client';
import type { PublicUser } from '@/lib/api/types';

export type AuthStatus =
  | 'loading'
  | 'error'
  | 'unauthenticated'
  | 'authenticated';

interface AuthContextValue {
  user: PublicUser | null;
  status: AuthStatus;
  error: string | null;
  retrySession: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [error, setError] = useState<string | null>(null);

  const retrySession = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const session = await api.getSession();
      setUser(session.user);
      setStatus(session.user ? 'authenticated' : 'unauthenticated');
    } catch (sessionError) {
      setError(getErrorMessage(sessionError));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let active = true;
    void api
      .getSession()
      .then((session) => {
        if (!active) {
          return;
        }
        setUser(session.user);
        setStatus(session.user ? 'authenticated' : 'unauthenticated');
      })
      .catch((sessionError: unknown) => {
        if (!active) {
          return;
        }
        setError(getErrorMessage(sessionError));
        setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    setUser(response.user);
    setStatus('authenticated');
    setError(null);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const response = await api.register(name, email, password);
      setUser(response.user);
      setStatus('authenticated');
      setError(null);
    },
    [],
  );

  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
  }, []);

  const value = useMemo(
    () => ({ user, status, error, retrySession, signIn, register, signOut }),
    [user, status, error, retrySession, signIn, register, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
