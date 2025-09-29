import 'dotenv/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'com.financefarm.simulator.dev';
  }
  if (IS_PREVIEW) {
    return 'com.financefarm.simulator.preview';
  }
  return 'com.financefarm.simulator';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'Finance Farm (Dev)';
  }
  if (IS_PREVIEW) {
    return 'Finance Farm (Preview)';
  }
  return 'Finance Farm Simulator';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'finance-farm-simulator',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: getUniqueIdentifier(),
      buildNumber: '1',
      infoPlist: {
        NSCameraUsageDescription: 'This app uses the camera to scan receipts for expense tracking.',
        NSMicrophoneUsageDescription: 'This app uses the microphone for voice commands to log expenses.',
        NSFaceIDUsageDescription: 'This app uses Face ID for secure authentication.',
        ITSAppUsesNonExemptEncryption: false,
        CFBundleAllowMixedLocalizations: true,
        CFBundleLocalizations: ['en', 'zh-Hans', 'zh-Hant'],
      },
      associatedDomains: ['applinks:financefarm.app'],
      config: {
        usesNonExemptEncryption: false,
      },
      privacyManifests: {
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryUserDefaults',
            NSPrivacyAccessedAPITypeReasons: ['CA92.1'],
          },
          {
            NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryFileTimestamp',
            NSPrivacyAccessedAPITypeReasons: ['C617.1'],
          },
        ],
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF'
      },
      package: getUniqueIdentifier(),
      versionCode: 1,
      permissions: [
        'CAMERA',
        'RECORD_AUDIO',
        'USE_FINGERPRINT',
        'USE_BIOMETRIC',
        'INTERNET',
        'ACCESS_NETWORK_STATE',
        'WRITE_EXTERNAL_STORAGE',
        'READ_EXTERNAL_STORAGE',
      ],
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'financefarm.app',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      // Minimal plugins for basic functionality
    ],
    extra: {
      eas: {
        projectId: process.env.EAS_PROJECT_ID || 'your-project-id-here',
      },
      apiUrl: IS_DEV 
        ? 'http://localhost:3000/api' 
        : IS_PREVIEW 
          ? 'https://api-preview.financefarm.app' 
          : 'https://api.financefarm.app',
      environment: IS_DEV ? 'development' : IS_PREVIEW ? 'preview' : 'production',
      enableAnalytics: !IS_DEV,
      enableCrashReporting: !IS_DEV,
    },
    owner: 'financefarm',
    runtimeVersion: {
      policy: 'sdkVersion',
    },
    updates: {
      url: 'https://u.expo.dev/your-project-id-here',
      enabled: true,
      checkAutomatically: 'ON_LOAD',
      fallbackToCacheTimeout: 10000,
    },
    scheme: 'financefarm',
    experiments: {
      typedRoutes: true,
    },
  },
};