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
  plugins: {
    SystemBars: {
      // no status bar (iOS); Android's immersive mode is in MainActivity.java
      hidden: true,
      // the game reads the cutout / home-bar insets from CSS env(safe-area-inset-*) (core/canvas.ts),
      // so Capacitor's extra --safe-area-* variables aren't needed
      insetsHandling: 'native',
      initialViewportFitValueHint: 'cover',
    },
  },
};

export default config;
