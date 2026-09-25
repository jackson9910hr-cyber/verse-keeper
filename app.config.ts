import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Bundle ID is permanent once registered in App Store Connect (docs/open-questions.md Q5).
 * Override without editing code: IOS_BUNDLE_ID=com.example.versekeeper eas build ...
 */
const BUNDLE_ID = process.env.IOS_BUNDLE_ID ?? 'io.github.jackson9910hr-cyber.versekeeper';
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Verse Keeper',
  slug: 'verse-keeper',
  scheme: 'versekeeper',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  platforms: ['ios', 'android'],
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
    infoPlist: {
      CFBundleLocalizations: ['ko', 'en'],
      CFBundleDevelopmentRegion: 'en',
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: [],
    },
    // docs/app-review-risks.md §3 — union of Required Reason APIs used by React Native and Expo modules.
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
          NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
          NSPrivacyAccessedAPITypeReasons: ['C617.1', '0A2A.1', '3B52.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryDiskSpace',
          NSPrivacyAccessedAPITypeReasons: ['E174.1', '85F4.1'],
        },
        {
          NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategorySystemBootTime',
          NSPrivacyAccessedAPITypeReasons: ['35F9.1'],
        },
      ],
    },
  },
  android: {
    package: BUNDLE_ID.replace(/-/g, '_'),
    permissions: [],
    blockedPermissions: ['android.permission.INTERNET', 'android.permission.ACCESS_NETWORK_STATE'],
  },
  plugins: [
    'expo-router',
    'expo-sqlite',
    'expo-localization',
    'expo-sharing',
    'expo-status-bar',
    '@react-native-community/datetimepicker',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: '#F6F4EF',
        dark: { image: './assets/splash-icon.png', backgroundColor: '#121212' },
      },
    ],
    './plugins/withoutPushEntitlement',
  ],
  experiments: { typedRoutes: true },
  extra: {
    router: {},
    ...(EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : {}),
  },
});
