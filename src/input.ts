// Mouse / touch / keyboard. Buttons are handled here; everything else goes to the scene or the kitchen station.
import { initAudio } from './audio/engine';
import { sfx } from './audio/sfx';
import { canvas, toScreenPoint } from './core/canvas';
import { shade } from './core/color';
import type { Point } from './core/math';
import { burst } from './core/particles';
import { findButtonAt, pointer, ui } from './core/ui';
import { runtime, type StationIndex } from './game/state';
import { GLAZE_STATION_INDEX, STATIONS } from './kitchen/stations';
import { handleHallEnterKey, skipSpeechTyping } from './scenes/hall';
import { selectStation } from './scenes/kitchen';

const activeStation = () => (runtime.scene === 'kitchen' && runtime.cake ? STATIONS[runtime.station] : null);

function updatePointer(event: PointerEvent): Point {
  const point = toScreenPoint(event.clientX, event.clientY);
  pointer.x = point.x;
  pointer.y = point.y;
  return point;
}

function onPointerDown(event: PointerEvent): void {
  initAudio(); // browsers only allow sound after a user gesture
  const point = updatePointer(event);
  pointer.isDown = true;
  try { canvas.setPointerCapture(event.pointerId); } catch { /* not supported */ }
  if (runtime.fade) return;
  const hit = findButtonAt(point);
  if (hit) { ui.pressedId = hit.id; return; }
  if (runtime.modal) return;
  if (runtime.scene === 'hall' && skipSpeechTyping()) return;
  activeStation()?.onPointerDown?.(point, runtime.cake!);
}

function onPointerMove(event: PointerEvent): void {
  const point = updatePointer(event);
  activeStation()?.onPointerMove?.(point, runtime.cake!);
}

function onPointerUp(event: PointerEvent): void {
  const point = updatePointer(event);
  pointer.isDown = false;
  // a button fires only if the pointer is released over the same button it was pressed on
  if (ui.pressedId) {
    const hit = findButtonAt(point);
    if (hit && hit.id === ui.pressedId && !hit.disabled && !runtime.fade) {
      if (!hit.silent) (hit.sound === 'tab' ? sfx.tab : sfx.click)();
      burst(point.x, point.y, 7, ['#ffffff', '#9feaff', shade(hit.color, 0.4)], { kind: 'star', gravity: 40, minSpeed: 40, maxSpeed: 150, minSize: 2, maxSize: 4 });
      hit.onClick?.();
    }
    ui.pressedId = null;
    return;
  }
  releaseGestures(point);
}

/** Finishes any drag / piping / drawing in progress. */
function releaseGestures(point: Point): void {
  // every station gets the release, so nothing stays stuck if the tab changed mid-gesture
  if (activeStation()) for (const station of STATIONS) station.onPointerUp?.(point, runtime.cake!);
  clearGestures();
}

function clearGestures(): void {
  runtime.isPipingCream = false;
  runtime.draggedTopping = null;
  runtime.heldPotion = null;
  runtime.magicStroke = null;
}

/** The browser took the pointer away (e.g. a system gesture): drop everything, but put a held bottle back. */
function onPointerCancel(): void {
  pointer.isDown = false;
  ui.pressedId = null;
  if (activeStation() && runtime.heldPotion) STATIONS[GLAZE_STATION_INDEX].onPointerUp?.(pointer, runtime.cake!);
  clearGestures();
}

function onKeyDown(event: KeyboardEvent): void {
  if (runtime.fade) return;
  if (runtime.modal) { if (event.key === 'Escape') runtime.modal = null; return; }
  if (runtime.scene === 'kitchen' && runtime.cake && event.key >= '1' && event.key <= String(STATIONS.length)) {
    selectStation((Number(event.key) - 1) as StationIndex);
    sfx.tab();
  }
  if (runtime.scene === 'hall' && event.key === 'Enter') handleHallEnterKey();
}

export function setUpInput(): void {
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerCancel);
  window.addEventListener('keydown', onKeyDown);
}
