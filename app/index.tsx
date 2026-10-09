import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import AccessErrorScreen from '@/components/AccessErrorScreen';

export default function IndexScreen() {
  const { status, error, retryAuthorization, logout } = useAuth();

  if (
    status === 'initializing' ||
    status === 'checking' ||
    status === 'logging-out'
  ) {
    return (
      <LoadingScreen
        message={status === 'logging-out' ? 'Signing out...' : undefined}
      />
    );
  }

  if (status === 'authorized') {
    return <Redirect href="/dashboard" />;
  }

  if (status === 'error') {
    return (
      <AccessErrorScreen
        message={error}
        onRetry={retryAuthorization}
        onLogout={logout}
      />
    );
  }

  if (status === 'logout-error') {
    return (
      <AccessErrorScreen
        title="Could not sign out"
        message={error}
        retryLabel="Try signing out again"
        onRetry={logout}
      />
    );
  }

  return <Redirect href="/login" />;
}
