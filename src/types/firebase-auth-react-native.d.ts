import type { Persistence } from 'firebase/auth';

interface ReactNativeAuthStorage {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

declare module 'firebase/auth' {
  // Firebase's RN runtime entry exports this helper; its wrapper typings omit it.
  export function getReactNativePersistence(
    storage: ReactNativeAuthStorage,
  ): Persistence;
}
