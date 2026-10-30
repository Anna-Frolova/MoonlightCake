// Switching scenes with a fade, plus the shared toast message and confirmation dialog.
import { sfx } from '../audio/sfx';
import { clock } from '../core/clock';
import { runtime, type SceneId } from '../game/state';

const TOAST_SECONDS = 2.4;

/**
 * Fades to black, runs `onSwitch` (set up the new scene there), switches to `scene`, fades back in.
 * Ignored while another fade is running.
 */
export function goToScene(scene: SceneId, onSwitch?: () => void): void {
  if (runtime.fade) return;
  sfx.whoosh();
  runtime.fade = {
    alpha: 0, direction: 1,
    onMidpoint: () => {
      onSwitch?.();
      runtime.scene = scene;
      runtime.sceneStartTime = clock.time;
    },
  };
}

export function showToast(text: string): void {
  runtime.toast = { text, remaining: TOAST_SECONDS, startTime: clock.time };
}

export function showModal(text: string, confirmLabel: string, cancelLabel: string, onConfirm: () => void, danger = false): void {
  runtime.modal = { text, confirmLabel, cancelLabel, onConfirm, danger, startTime: clock.time };
}
