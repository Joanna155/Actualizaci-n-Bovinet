import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter', //  ID de app
  appName: 'Bovinet',
  webDir: 'www',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchAutoHide: false, // <--- ESTO ES LO MÁS IMPORTANTE
      launchShowDuration: 0,
      splashFullScreen: true,
      splashImmersive: true
    }
  }
};

export default config;