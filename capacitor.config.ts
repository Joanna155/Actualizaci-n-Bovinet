<<<<<<< HEAD
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'bovine-app-v2',
  webDir: 'www'
};

export default config;
=======
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
>>>>>>> 8d9726f7d170df52a39b0a228a952654c5f3a85f
