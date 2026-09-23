import { Card, SectionLabel } from "@/app/ui";
import type { SafetyNote } from "@/lib/types";

/**
 * Food-safety findings, shown with the recipe rather than buried.
 *
 * These come from a deterministic rule set (lib/safety.ts), not from the
 * generator, which is the point: the model that wrote a risky instruction is
 * the last thing you'd trust to notice it.
 */
export function SafetyNotes({ notes }: { notes: SafetyNote[] }) {
  if (notes.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionLabel>Before you cook</SectionLabel>
      <ul className="space-y-3">
        {notes.map((note) => {
          const danger = note.severity === "danger";
          return (
            <li key={note.id}>
              <Card
                padding="sm"
                className={
                  danger ? "border-danger bg-danger-soft" : "border-edge"
                }
              >
                <p
                  className={`flex items-start gap-2 text-sm font-medium ${
                    danger ? "text-danger" : "text-foreground"
                  }`}
                >
                  <span aria-hidden className="mt-px">
                    {danger ? "⚠" : "ℹ"}
                  </span>
                  <span>
                    <span className="sr-only">
                      {danger ? "Safety warning: " : "Safety note: "}
                    </span>
                    {note.title}
                  </span>
                </p>
                <p className="mt-1.5 pl-6 text-sm leading-relaxed text-muted">
                  {note.detail}
                </p>
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
