"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * The fridge contents live in localStorage rather than component state so they
 * survive a reload — retyping the list on every visit is the fastest way to
 * make this tool annoying. Because the real source of truth is outside React,
 * this is a `useSyncExternalStore` subscription rather than state seeded by an
 * effect, which also gets cross-tab sync for free.
 */

const KEY = "fridge-chef:pantry";

const listeners = new Set<() => void>();

/** getSnapshot must return a stable reference while nothing has changed, so the
 *  parsed array is memoised against the raw string it came from. */
let cache: { raw: string; value: string[] } = { raw: "[]", value: [] };

const EMPTY: string[] = [];

function parse(raw: string): string[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function getSnapshot(): string[] {
  let raw: string;
  try {
    raw = window.localStorage.getItem(KEY) ?? "[]";
  } catch {
    // Private mode or blocked storage: fall back to whatever is in memory.
    return cache.value;
  }
  if (raw !== cache.raw) {
    cache = { raw, value: parse(raw) };
  }
  return cache.value;
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function usePantry(): [string[], (next: string[]) => void] {
  const items = useSyncExternalStore(subscribe, getSnapshot, () => EMPTY);

  const setItems = useCallback((next: string[]) => {
    const raw = JSON.stringify(next);
    // Update the in-memory cache first so the UI still works if the write fails.
    cache = { raw, value: next };
    try {
      window.localStorage.setItem(KEY, raw);
    } catch {
      // Ignore: persistence is a convenience, not a requirement.
    }
    for (const listener of listeners) listener();
  }, []);

  return [items, setItems];
}
