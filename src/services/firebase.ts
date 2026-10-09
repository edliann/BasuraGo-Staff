import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import {
  connectFunctionsEmulator,
  getFunctions,
} from 'firebase/functions';

import {
  firebaseConfig,
  firebaseEmulatorHost,
  useFirebaseEmulators,
} from '@/config/env';

const app =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

function initializeStaffAuth() {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'auth/already-initialized'
    ) {
      return getAuth(app);
    }
    throw error;
  }
}

export const auth = initializeStaffAuth();
export const functions = getFunctions(app, 'us-central1');

if (useFirebaseEmulators) {
  connectAuthEmulator(
    auth,
    `http://${firebaseEmulatorHost}:9099`,
    { disableWarnings: true },
  );
  connectFunctionsEmulator(functions, firebaseEmulatorHost, 5001);
}

export default app;
