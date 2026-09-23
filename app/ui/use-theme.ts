"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The viewer's theme choice.
 *
 * "system" means "follow the OS", which is the default and what the CSS does on
 * its own. Choosing light or dark stamps `data-theme` on <html>, which the
 * token layer in globals.css uses to override the media query in both
 * directions.
 *
 * Like the pantry, the source of truth is localStorage — outside React — so
 * this is a `useSyncExternalStore` subscription rather than state seeded by an
 * effect. That also keeps two open tabs in agreement.
 */

export type Theme = "system" | "light" | "dark";

export const THEME_KEY = "fridge-chef:theme";

const listeners = new Set<() => void>();

function isTheme(value: unknown): value is Theme {
  return value === "system" || value === "light" || value === "dark";
}

function getSnapshot(): Theme {
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    return isTheme(stored) ? stored : "system";
  } catch {
    // Blocked storage: behave as though nothing was ever chosen.
    return "system";
  }
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** Apply a choice to the document. Exported so the no-flash script and the
 *  toggle stay in agreement about what "applied" means. */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

export function useTheme(): [Theme, (next: Theme) => void] {
  const theme = useSyncExternalStore(subscribe, getSnapshot, () => "system" as const);

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next);
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      // Ignore: the choice just won't survive a reload.
    }
    for (const listener of listeners) listener();
  }, []);

  return [theme, setTheme];
}
