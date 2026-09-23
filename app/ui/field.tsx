import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "./styles";

/**
 * One control surface, shared by input, textarea and select. This string used
 * to be copy-pasted into every component that needed a form control, which is
 * how the two copies ended up drifting.
 */
const control =
  "w-full rounded-field border border-edge bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-accent disabled:opacity-50";

export type FieldProps = {
  /** Must match the control's `id` so clicking the label focuses it. */
  htmlFor: string;
  label: ReactNode;
  /** Quiet guidance shown under the control. */
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint, stacked with consistent spacing. */
export function Field({ htmlFor, label, hint, children, className }: FieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, "resize-y", className)} {...props} />;
}

export function Select({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, className)} {...props} />;
}
