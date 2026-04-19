import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Investors Playground',
  slug: 'investorsplayground',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './src/assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './src/assets/icon.png',
    resizeMode: 'contain',
    backgroundColor: '#f9fafb',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.schmapps.investorsplayground',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './src/assets/icon.png',
      backgroundColor: '#f9fafb',
    },
    package: 'com.schmapps.investorsplayground',
  },
  scheme: 'investorsplayground',
  web: {
    bundler: 'metro',
    favicon: './src/assets/icon.png',
  },
  plugins: [
    [
      'expo-build-properties',
      {
        android: {
          compileSdkVersion: 35,
          targetSdkVersion: 35,
          buildToolsVersion: '35.0.0',
        },
      },
    ],
  ],
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? '',
    },
    revenueCat: {
      appleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? '',
      googleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? '',
      entitlementId: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'pro',
      offeringId: process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ?? '',
    },
  },
});
