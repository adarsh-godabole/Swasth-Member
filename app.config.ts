import type { ExpoConfig } from 'expo/config';

// One build per gym: the gym code is baked in here, never typed or picked by
// the member. Building for a second gym is a config change (or an EAS env var),
// not a code change.
//
// No EXPO_PUBLIC_ prefix: this file is evaluated by Node on the build machine,
// so it can read any env var. The prefix only matters for process.env reads
// that Metro has to inline into the client bundle. Both values reach the app
// through `extra` below, read via expo-constants in src/config.ts.
const gymCode = process.env.GYM_CODE ?? 'swasth-koramangala';
const apiBaseUrl =
  process.env.API_BASE_URL ?? 'https://swasth-be.onrender.com/api/v1';

const config: ExpoConfig = {
  name: 'Swasth',
  slug: 'swasth-member',
  scheme: 'swasth',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.swasth.member',
  },
  android: {
    package: 'com.swasth.member',
    adaptiveIcon: {
      backgroundColor: '#0B1120',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: './assets/favicon.png' },
  plugins: ['expo-router', 'expo-secure-store'],
  extra: {
    gymCode,
    apiBaseUrl,
  },
};

export default config;
