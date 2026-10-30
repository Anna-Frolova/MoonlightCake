/** Game time, advanced once per frame by the main loop. Shared by every animation. */
export const clock = {
  /** Seconds since the game started. */
  time: 0,
  /** Seconds since the previous frame (capped, so a background tab does not cause a huge jump). */
  delta: 0.016,
};
