/**
 * Reading structure out of method steps.
 *
 * Steps stay free text — that's what makes them readable — but cook mode needs
 * to know when a step is really a wait, so it can offer a timer instead of
 * making you find your phone's clock with oily hands.
 */

/**
 * Pull a duration in minutes out of a step, or null if it isn't a timed one.
 *
 * A range takes the longer end ("3–4 minutes" → 4): you can always stop a timer
 * early, but one that cries off too soon teaches you to ignore it.
 */
export function findMinutes(step: string): number | null {
  // Ranges written with a hyphen, en dash or em dash.
  const range = step.match(/(\d+)\s*[–—-]\s*(\d+)\s*min/i);
  if (range) return Number(range[2]);

  const single = step.match(/(\d+)\s*min/i);
  if (single) return Number(single[1]);

  // "30 seconds" is worth a timer too, rounded up to the nearest minute.
  const seconds = step.match(/(\d+)\s*second/i);
  if (seconds) return Math.max(1, Math.round(Number(seconds[1]) / 60));

  // An hour shows up in slow recipes.
  const hours = step.match(/(\d+)\s*hour/i);
  if (hours) return Number(hours[1]) * 60;

  return null;
}

/** mm:ss for a countdown. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
