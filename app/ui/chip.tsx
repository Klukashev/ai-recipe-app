import type { ReactNode } from "react";

import { cn, interactive } from "./styles";

/**
 * A pill. Three jobs that look related and used to be three unrelated
 * hand-written class strings:
 *
 *  - `Tag`          — static, non-interactive metadata (recipe tags)
 *  - `RemovableChip` — an item you can take out of a list (fridge ingredients)
 *  - `ToggleChip`   — an on/off choice (dietary filters, quick-add suggestions)
 */

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-edge px-2.5 py-0.5 text-xs text-muted">
      {children}
    </span>
  );
}

export function RemovableChip({
  children,
  onRemove,
  removeLabel,
}: {
  children: ReactNode;
  onRemove: () => void;
  /** Screen-reader text, e.g. "Remove eggs". */
  removeLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeLabel}
      className={cn(
        "group flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-sm text-accent",
        "hover:bg-accent-soft-hover",
        interactive,
      )}
    >
      {children}
      <span aria-hidden className="opacity-50 group-hover:opacity-100">
        ×
      </span>
    </button>
  );
}

export function ToggleChip({
  children,
  pressed,
  onToggle,
  size = "md",
}: {
  children: ReactNode;
  pressed: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={cn(
        "rounded-full border",
        interactive,
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1 text-sm",
        pressed
          ? "border-accent bg-accent-soft text-accent"
          : "border-edge text-muted hover:border-accent hover:text-accent",
      )}
    >
      {children}
    </button>
  );
}

export type BadgeTone = "neutral" | "accent" | "danger" | "caution";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "border-edge text-muted",
  accent: "border-accent bg-accent-soft text-accent",
  danger: "border-danger bg-danger-soft text-danger",
  caution: "border-edge bg-accent-soft text-accent",
};

/**
 * A small status marker. Unlike `Tag` this carries meaning rather than
 * metadata — "Untested", "Cooked 3×", a safety severity.
 */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: BadgeTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        BADGE_TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
