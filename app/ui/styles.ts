/**
 * The two helpers every component in `app/ui` is built from.
 *
 * Deliberately tiny — no `clsx`, no `cva`, no `tailwind-merge`. Components here
 * expose a closed set of variants rather than accepting arbitrary overrides, so
 * the heavier machinery those libraries provide has nothing to do.
 */

type ClassValue = string | false | null | undefined;

/** Join class names, dropping anything falsy so conditionals read cleanly. */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Look up a variant's classes with a guaranteed fallback.
 *
 * Keeping the maps next to each component (rather than in one central registry)
 * means a component's full set of appearances is visible in one screen of code.
 */
export function pick<K extends string>(
  map: Record<K, string>,
  key: K | undefined,
  fallback: K,
): string {
  return map[key ?? fallback] ?? map[fallback];
}

/** Shared by every interactive control, so focus and disabled look the same everywhere. */
export const interactive =
  "transition-colors disabled:cursor-not-allowed disabled:opacity-50";
