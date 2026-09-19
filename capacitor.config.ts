import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.woddi.games',
  appName: 'ودّي',
  webDir: 'out',
  server: {
    url: 'https://woddi.vercel.app',
    cleartext: true
  }
};

export default config;