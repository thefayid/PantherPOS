import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.pantherpos.app',
  appName: 'PantherPOS',
  webDir: 'dist',
  server: {
    url: 'http://192.168.1.164:5173',
    cleartext: true
  }
};

export default config;
