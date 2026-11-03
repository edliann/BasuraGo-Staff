import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { AuthProvider } from '@/contexts/AuthContext';
import OfflineConnectionGate from '@/components/OfflineConnectionGate';

export default function RootLayout() {
  return (
    <OfflineConnectionGate>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </OfflineConnectionGate>
  );
}
