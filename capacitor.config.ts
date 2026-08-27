import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sulthanharamain.app',
  appName: 'Sulthan Haramain',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
    allowNavigation: ['*']
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#064e3b",
      showSpinner: false,
      androidScaleType: "CENTER_CROP"
    }
  }
};

export default config;
