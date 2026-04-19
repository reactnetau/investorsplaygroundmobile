import { ExpoConfig, ConfigContext } from 'expo/config';

const buildNumbers = require('./build-numbers.json');
const iosBuildNumber = process.env.IOS_BUILD_NUMBER ?? String(buildNumbers.iosBuildNumber ?? 1);
const androidVersionCode = Number.parseInt(
  process.env.ANDROID_VERSION_CODE ?? String(buildNumbers.androidVersionCode ?? 1),
  10
);
const defaultEasProjectId = 'c4ba061c-2b37-416f-856a-902f4f323763';
const configuredEasProjectId = process.env.EAS_PROJECT_ID ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID ?? '';
const easProjectId =
  configuredEasProjectId.trim() !== '' && configuredEasProjectId !== 'your-eas-project-id'
    ? configuredEasProjectId
    : defaultEasProjectId;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Investors Playground',
  slug: 'investorsplayground',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './src/assets/schmappslogo.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './src/assets/schmappslogo.png',
    resizeMode: 'contain',
    backgroundColor: '#F8FAFC',
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.schmapps.investorsplayground',
    buildNumber: iosBuildNumber,
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    versionCode: Number.isFinite(androidVersionCode) ? androidVersionCode : 1,
    adaptiveIcon: {
      foregroundImage: './src/assets/schmappslogo.png',
      backgroundColor: '#F8FAFC',
    },
    package: 'com.schmapps.investorsplayground',
  },
  scheme: 'investorsplayground',
  web: {
    bundler: 'metro',
    favicon: './src/assets/schmappslogo.png',
  },
  plugins: [
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '15.1',
        },
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
      projectId: easProjectId,
    },
    revenueCat: {
      appleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_APPLE_API_KEY ?? '',
      googleApiKey: process.env.EXPO_PUBLIC_REVENUECAT_GOOGLE_API_KEY ?? '',
      entitlementId: process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID ?? 'pro',
      offeringId: process.env.EXPO_PUBLIC_REVENUECAT_OFFERING_ID ?? '',
    },
  },
});
