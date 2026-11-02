// Behaviour that only exists in the iOS / Android app (Capacitor); in a browser nothing here runs.
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { setAudioPaused } from './audio/engine';
import { runtime } from './game/state';

export function setUpNativeApp(): void {
  if (!Capacitor.isNativePlatform()) return;
  // the sound stops with the app even where the web view doesn't report itself hidden
  void App.addListener('appStateChange', ({ isActive }) => setAudioPaused(!isActive));
  // Android "back": closes an open question like its "Cancel" button; otherwise the game goes to the
  // background (progress is saved as you play) instead of quitting.
  void App.addListener('backButton', () => {
    if (runtime.modal) runtime.modal = null;
    else void App.minimizeApp();
  });
}
