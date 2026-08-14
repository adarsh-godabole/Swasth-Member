import * as SecureStore from 'expo-secure-store';

import type { TokenPair } from './types';

const REFRESH_KEY = 'swasth.refreshToken';

/**
 * The refresh token lives in the Keychain / Keystore. The access token stays in
 * memory only — it expires in 15 minutes and is re-derived by refreshing on
 * cold start. Neither ever touches AsyncStorage.
 */
let accessToken: string | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export async function getRefreshToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

export async function saveTokens({ accessToken: at, refreshToken }: TokenPair) {
  accessToken = at;
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export async function clearTokens() {
  accessToken = null;
  try {
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  } catch {
    // deleting a key that isn't there is fine
  }
}
