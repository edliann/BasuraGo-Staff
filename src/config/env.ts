function requiredEnv(value: string | undefined, name: string): string {
  if (!value?.trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value.trim();
}

export const firebaseConfig = {
  apiKey: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    'EXPO_PUBLIC_FIREBASE_API_KEY',
  ),
  authDomain: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  ),
  projectId: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  ),
  storageBucket: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  ),
  messagingSenderId: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  ),
  appId: requiredEnv(
    process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    'EXPO_PUBLIC_FIREBASE_APP_ID',
  ),
};

export const useFirebaseEmulators =
  process.env.EXPO_PUBLIC_FIREBASE_USE_EMULATORS === 'true';

export const firebaseEmulatorHost =
  process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST?.trim() || '10.0.2.2';
