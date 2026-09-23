import type { ReactNode } from "react";

import { cn } from "./styles";

/**
 * An inline message. `role="alert"` means assistive technology announces it
 * when it appears, which is the whole point for a failed action — previously
 * these were bare `<p>` tags with a hand-picked red that had to be restated for
 * dark mode. The `danger` token handles that now.
 */
export function Alert({
  children,
  tone = "danger",
  className,
}: {
  children: ReactNode;
  tone?: "danger" | "muted";
  className?: string;
}) {
  return (
    <p
      role={tone === "danger" ? "alert" : undefined}
      className={cn(
        "rounded-field px-3 py-2 text-sm",
        tone === "danger" ? "bg-danger-soft text-danger" : "text-muted",
        className,
      )}
    >
      {children}
    </p>
  );
}
