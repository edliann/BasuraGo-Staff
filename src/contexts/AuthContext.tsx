import {
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { auth } from '@/services/firebase';
import {
  getAuthorizedDashboard,
  signOutStaff,
  type FacilityStaffDashboard,
} from '@/services/facilityStaff';

type AuthStatus =
  | 'initializing'
  | 'signed-out'
  | 'checking'
  | 'authorized'
  | 'unauthorized'
  | 'error'
  | 'logging-out'
  | 'logout-error';

interface AuthContextValue {
  user: User | null;
  dashboard: FacilityStaffDashboard | null;
  status: AuthStatus;
  error: string;
  authorizationRetrying: boolean;
  clearError: () => void;
  retryAuthorization: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTHORIZATION_CHECK_INTERVAL_MS = 30_000;

function getAuthorizationError(error: unknown): {
  unauthorized: boolean;
  message: string;
} {
  const code =
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
      ? error.code
      : '';

  if (
    code === 'functions/permission-denied' ||
    code === 'functions/unauthenticated' ||
    code === 'auth/user-disabled' ||
    code === 'auth/user-token-expired' ||
    code === 'auth/id-token-revoked'
  ) {
    return {
      unauthorized: true,
      message:
        'Your account is no longer authorized. Please sign in again if your access has been restored.',
    };
  }

  if (
    code === 'functions/unavailable' ||
    code === 'functions/deadline-exceeded' ||
    code === 'auth/network-request-failed'
  ) {
    return {
      unauthorized: false,
      message:
        'The service is unavailable. Check your connection and try again.',
    };
  }

  return {
    unauthorized: false,
    message: 'Unable to verify your facility access. Please try again.',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [dashboard, setDashboard] =
    useState<FacilityStaffDashboard | null>(null);
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [error, setError] = useState('');
  const [authorizationRetrying, setAuthorizationRetrying] = useState(false);

  const authorizationCheckInProgress = useRef(false);
  const logoutRequested = useRef(false);

  const logout = useCallback(async () => {
    logoutRequested.current = true;
    setDashboard(null);
    setStatus('logging-out');
    setError('');

    try {
      await signOutStaff();
      logoutRequested.current = false;
      setUser(null);
      setDashboard(null);
      setStatus('signed-out');
      setError('');
    } catch (logoutError) {
      console.error('Facility staff logout failed:', logoutError);
      setError(
        "We couldn't sign you out. Your session may still be active. " +
          'Please try signing out again.',
      );
      setStatus('logout-error');
    }
  }, []);

  const clearError = useCallback(() => {
    setError('');
  }, []);

  const retryAuthorization = useCallback(async () => {
    if (
      authorizationCheckInProgress.current ||
      logoutRequested.current
    ) {
      return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setDashboard(null);
      setError('');
      setStatus('signed-out');
      return;
    }

    authorizationCheckInProgress.current = true;
    setAuthorizationRetrying(true);

    try {
      const staffDashboard = await getAuthorizedDashboard();

      if (
        logoutRequested.current ||
        auth.currentUser?.uid !== currentUser.uid
      ) {
        return;
      }

      setDashboard(staffDashboard);
      setStatus('authorized');
    } catch (accessError) {
      if (
        logoutRequested.current ||
        auth.currentUser?.uid !== currentUser.uid
      ) {
        return;
      }

      console.error('Facility staff authorization retry failed:', accessError);
      const result = getAuthorizationError(accessError);
      setError(result.message);

      if (result.unauthorized) {
        setDashboard(null);
        setStatus('unauthorized');

        try {
          await signOutStaff();
        } catch (signOutError) {
          console.error(
            'Unable to sign out deactivated facility staff:',
            signOutError,
          );
        }
      } else if (status !== 'authorized') {
        setStatus('error');
      }
    } finally {
      authorizationCheckInProgress.current = false;
      setAuthorizationRetrying(false);
    }
  }, [status]);

  useEffect(() => {
    let active = true;
    let requestId = 0;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!active) return;
        const currentRequest = ++requestId;

        if (!currentUser) {
          logoutRequested.current = false;
          setUser(null);
          setDashboard(null);
          setError('');
          authorizationCheckInProgress.current = false;

          setStatus((previous) =>
            previous === 'unauthorized' ? previous : 'signed-out',
          );
          return;
        }

        if (logoutRequested.current) return;

        setUser(currentUser);
        setDashboard(null);
        setStatus('checking');

        try {
          const staffDashboard = await getAuthorizedDashboard();

          if (
            !active ||
            currentRequest !== requestId ||
            logoutRequested.current
          ) {
            return;
          }

          setDashboard(staffDashboard);
          setError('');
          setStatus('authorized');
        } catch (accessError) {
          if (
            !active ||
            currentRequest !== requestId ||
            logoutRequested.current
          ) {
            return;
          }

          console.error(
            'Facility staff authorization failed:',
            accessError,
          );

          const result = getAuthorizationError(accessError);
          setError(result.message);

          if (result.unauthorized) {
            setStatus('unauthorized');
            setDashboard(null);

            try {
              await signOutStaff();
            } catch (signOutError) {
              console.error(
                'Unable to clear an unauthorized facility staff session:',
                signOutError,
              );
            }

            return;
          }

          setStatus('error');
        }
      },
      (authError) => {
        if (!active) return;

        console.error(
          'Firebase Auth state listener failed:',
          authError,
        );

        setUser(null);
        setDashboard(null);
        setError(
          'Unable to restore your session. Check your connection and try again.',
        );
        setStatus('error');
      },
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (status !== 'authorized' || !user) return;

    let active = true;

    const intervalId = setInterval(async () => {
      if (
        !active ||
        authorizationCheckInProgress.current ||
        logoutRequested.current
      ) {
        return;
      }

      const currentUser = auth.currentUser;

      if (!currentUser || currentUser.uid !== user.uid) return;

      authorizationCheckInProgress.current = true;
      setAuthorizationRetrying(true);

      try {
        // Re-check authorization against the backend.
        await getAuthorizedDashboard();

        if (
          !active ||
          logoutRequested.current ||
          auth.currentUser?.uid !== user.uid
        ) {
          return;
        }

        setError('');
      } catch (accessError) {
        if (
          !active ||
          logoutRequested.current ||
          auth.currentUser?.uid !== user.uid
        ) {
          return;
        }

        console.error(
          'Facility staff session verification failed:',
          accessError,
        );

        const result = getAuthorizationError(accessError);
        setError(result.message);

        if (result.unauthorized) {
          setStatus('unauthorized');
          setDashboard(null);

          try {
            await signOutStaff();
          } catch (signOutError) {
            console.error(
              'Unable to sign out deactivated facility staff:',
              signOutError,
            );
          }
        }
      } finally {
        authorizationCheckInProgress.current = false;
        setAuthorizationRetrying(false);
      }
    }, AUTHORIZATION_CHECK_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [status, user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        dashboard,
        status,
        error,
        authorizationRetrying,
        clearError,
        retryAuthorization,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }

  return context;
}