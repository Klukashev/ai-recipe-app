import type { ButtonHTMLAttributes } from "react";

import { cn, interactive, pick } from "./styles";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  /** The one action a screen most wants you to take. At most one per view. */
  primary:
    "bg-accent text-accent-contrast hover:opacity-90 disabled:hover:opacity-100",
  /** Equal-weight alternatives sitting beside a primary. */
  secondary:
    "border border-edge text-foreground hover:border-accent hover:text-accent",
  /** Low-emphasis, for navigation and tertiary actions. */
  ghost: "text-muted hover:bg-card hover:text-foreground",
  /** Destructive. Muted until hovered, so it never competes for attention. */
  danger:
    "border border-edge text-muted hover:border-danger hover:text-danger",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-base",
};

/**
 * Returns the class string for a button-shaped element.
 *
 * Use this for `<Link>`s that should look like buttons — it's why the styling
 * lives in a function rather than only inside the component. Before this
 * existed, link-buttons were hand-copied class strings that drifted out of sync
 * with the real buttons.
 */
export function buttonStyles({
  variant,
  size,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}): string {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium",
    interactive,
    pick(VARIANTS, variant, "primary"),
    pick(SIZES, size, "md"),
    className,
  );
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant,
  size,
  className,
  type = "button",
  ...props
}: ButtonProps) {
  // Defaulting to type="button" matters: a bare <button> inside a <form>
  // submits it, which is almost never what these are for.
  return (
    <button
      type={type}
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}
