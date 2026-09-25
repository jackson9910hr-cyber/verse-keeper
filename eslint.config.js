// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

const NETWORK_GLOBALS = ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource'].map((name) => ({
  name,
  message: 'Verse Keeper is offline-only: network calls are forbidden (CLAUDE.md).',
}));

const TRACKING_PACKAGES = [
  'firebase',
  '@react-native-firebase/*',
  '@sentry/*',
  'sentry-expo',
  'expo-tracking-transparency',
  '@amplitude/*',
  'react-native-google-mobile-ads',
  'expo-ads-admob',
  'mixpanel-react-native',
  'expo-insights',
  'expo-updates',
];

module.exports = defineConfig([
  expoConfig,
  prettier,
  {
    ignores: ['node_modules/*', 'coverage/*', '.expo/*', 'ios/*', 'android/*', 'dist/*'],
  },
  {
    rules: {
      'no-restricted-globals': ['error', ...NETWORK_GLOBALS],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: TRACKING_PACKAGES,
              message: 'Tracking/analytics/ads/remote SDKs are forbidden.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-native',
                'react-native-*',
                'expo',
                'expo-*',
                '@expo/*',
                '@/data/*',
                '@/ui/*',
                '@/platform/*',
                '@/features/*',
                '@/app/*',
                '@/i18n/*',
                '@/providers/*',
              ],
              message: 'src/domain must stay pure TypeScript (no React/Expo/data/UI imports).',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message: 'Inject a Clock instead of Date.now().',
        },
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message: 'Inject a Clock instead of new Date().',
        },
        {
          selector: "CallExpression[callee.object.name='Math'][callee.property.name='random']",
          message: 'Use the seeded RNG (src/domain/cloze/rng).',
        },
      ],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/features/**/*.{ts,tsx}', 'src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'expo-sqlite', message: 'UI must go through src/data repositories/services.' },
          ],
          patterns: [
            {
              group: TRACKING_PACKAGES,
              message: 'Tracking/analytics/ads/remote SDKs are forbidden.',
            },
          ],
        },
      ],
    },
  },
]);
