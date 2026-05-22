
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.classvault.app',
  appName: 'ClassVault',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true // Allows connecting to Firestore/Storage without SSL issues in dev
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;
