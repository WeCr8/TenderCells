import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wecr8.tendercells',
  appName: 'TenderCells',
  webDir: 'dist',
  ios: { contentInset: 'automatic' },
  android: { allowMixedContent: false },
};

export default config;
