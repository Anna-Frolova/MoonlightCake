import type { CapacitorConfig } from '@capacitor/cli';

// Native app shell (iOS / Android) around the web build in dist/.
// After `npm run build`, `npx cap sync` copies the game into the ios/ and android/ projects.
const config: CapacitorConfig = {
  // Bundle id: can't be changed once the app is registered with Apple / Google.
  appId: 'io.github.annafrolova.moonlightcake',
  appName: 'Місячний Корж',
  webDir: 'dist',
  // same as the game's own background, so nothing flashes white while it starts
  backgroundColor: '#0c0824',
};

export default config;
