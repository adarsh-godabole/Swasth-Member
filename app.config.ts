import type { ExpoConfig } from 'expo/config';

// One build per gym: the gym code is baked in here, never typed or picked by
// the member. Building for a second gym is a config change (or an EAS env var),
// not a code change.
const gymCode = process.env.EXPO_PUBLIC_GYM_CODE ?? 'swasth-koramangala';
const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://swasth-be.onrender.com/api/v1';

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
