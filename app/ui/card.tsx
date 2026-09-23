import type { HTMLAttributes, ReactNode } from "react";

import { cn, pick } from "./styles";

export type CardPadding = "none" | "sm" | "md" | "lg";

const PADDING: Record<CardPadding, string> = {
  none: "",
  sm: "p-4",
  md: "p-5",
  lg: "p-6 sm:p-8",
};

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: CardPadding;
  /** Dashed outline and no fill — for empty states rather than content. */
  hollow?: boolean;
  /** Lifts the border to the accent colour on hover, for cards that are links. */
  interactive?: boolean;
};

/** The standard raised surface: opaque, so page content stays readable above
 *  the decorative backdrop. */
export function Card({
  padding,
  hollow = false,
  interactive = false,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-card border",
        hollow ? "border-dashed border-edge" : "border-edge bg-card shadow-card",
        interactive && "transition-colors hover:border-accent",
        pick(PADDING, padding, "md"),
        className,
      )}
      {...props}
    />
  );
}

/** A quiet uppercase label above a group of content ("Ingredients", "Method"). */
export function SectionLabel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={cn(
        "text-sm font-semibold uppercase tracking-wide text-muted",
        className,
      )}
    >
      {children}
    </h2>
  );
}

/** The single h1 on a page. */
export function PageTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "text-3xl font-semibold tracking-tight text-balance",
        className,
      )}
    >
      {children}
    </h1>
  );
}
