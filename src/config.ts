import Constants from 'expo-constants';

type Extra = { gymCode: string; apiBaseUrl: string };

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

if (!extra.gymCode || !extra.apiBaseUrl) {
  throw new Error('Missing extra.gymCode / extra.apiBaseUrl in app.config.ts');
}

export const GYM_CODE = extra.gymCode;
export const API_BASE_URL = extra.apiBaseUrl;

/** devCode comes back from the OTP endpoint on staging only; never surface it in a release build. */
export const IS_DEV_BUILD = __DEV__;

export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
