import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wecr8.tendercells',
  appName: 'TenderCells',
  webDir: 'dist',
  ios: { contentInset: 'automatic' },
  // LAN rover control talks MQTT over ws:// to the farm broker (e.g. 192.168.x.x:9001).
  // targetSdk 36 forces edge-to-edge; keep the WebView clear of the status/nav bars.
  android: { allowMixedContent: true, adjustMarginsForEdgeToEdge: 'auto' },
  server: { cleartext: true },
};

export default config;
