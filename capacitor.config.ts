import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mydigital.mydigitalWallet',
  appName: 'MyDigitalWallet',
  webDir: 'www',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    plashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: '#4a6cf7',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
