"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { logCookAction } from "@/app/actions";
import { Alert, Button, Card, Field, SectionLabel, Textarea, cn } from "@/app/ui";
import type { CookEntry } from "@/lib/types";

/**
 * "I cooked this" — the feature the whole app is arranged around.
 *
 * Every other recipe app either serves human-written recipes it can vouch for,
 * or generates text and walks away. Because this one generates *and* keeps
 * what it generated, it can close the loop: a recipe accumulates a record of
 * having actually been made, and what you changed when you made it. That's what
 * turns a pile of generated suggestions into a cookbook worth keeping.
 */

function Stars({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (next: number | null) => void;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          role="radio"
          aria-checked={value === star}
          aria-label={`${star} out of 5`}
          // Clicking the current rating clears it — a rating you can't undo is
          // a rating people won't risk giving.
          onClick={() => onChange(value === star ? null : star)}
          className={cn(
            "text-2xl leading-none transition-colors",
            value !== null && star <= value ? "text-accent" : "text-muted opacity-40 hover:opacity-100",
          )}
        >
          ★
        </button>
      ))}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-2 text-xs text-muted underline underline-offset-2 hover:text-accent"
        >
          clear
        </button>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString();
}

export function CookLog({
  recipeId,
  entries,
  startOpen = false,
}: {
  recipeId: string;
  entries: CookEntry[];
  /** Cook mode sends you back here with the form already open. */
  startOpen?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(startOpen);
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();

  function submit() {
    setError(null);
    startSaving(async () => {
      const result = await logCookAction(recipeId, { rating, note });
      if (result.status === "error") {
        setError(result.message ?? "Could not save that.");
        return;
      }
      setOpen(false);
      setRating(null);
      setNote("");
      router.refresh();
    });
  }

  const averageRating = (() => {
    const rated = entries.filter((entry) => entry.rating !== null);
    if (rated.length === 0) return null;
    const total = rated.reduce((sum, entry) => sum + (entry.rating ?? 0), 0);
    return Math.round((total / rated.length) * 10) / 10;
  })();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionLabel>Cook log</SectionLabel>
        {averageRating !== null && (
          <span className="text-sm text-muted">
            <span className="text-accent">★</span> {averageRating} average over{" "}
            {entries.length} {entries.length === 1 ? "cook" : "cooks"}
          </span>
        )}
      </div>

      {!open && (
        <Button variant={entries.length === 0 ? "primary" : "secondary"} onClick={() => setOpen(true)}>
          {entries.length === 0 ? "I cooked this" : "Cooked it again"}
        </Button>
      )}

      {open && (
        <Card className="space-y-4">
          <div className="space-y-1.5">
            <span className="block text-sm font-medium">How did it go?</span>
            <Stars value={rating} onChange={setRating} />
          </div>

          <Field
            htmlFor="cook-note"
            label="What did you change?"
            hint="The useful part. Next time you cook this, past you gets to advise present you."
          >
            <Textarea
              id="cook-note"
              rows={3}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="doubled the garlic, 20 min was plenty, needed more salt…"
            />
          </Field>

          {error && <Alert>{error}</Alert>}

          <div className="flex flex-wrap gap-3">
            <Button onClick={submit} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save to log"}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
          </div>
        </Card>
      )}

      {entries.length > 0 && (
        <ul className="space-y-3">
          {[...entries].reverse().map((entry, index) => (
            <li
              key={`${entry.at}-${index}`}
              className="border-l-2 border-edge pl-4 text-sm"
            >
              <p className="flex flex-wrap items-center gap-2 text-muted">
                <span>{formatDate(entry.at)}</span>
                {entry.rating !== null && (
                  <span className="text-accent" aria-label={`${entry.rating} out of 5`}>
                    {"★".repeat(entry.rating)}
                    <span className="opacity-30">{"★".repeat(5 - entry.rating)}</span>
                  </span>
                )}
              </p>
              {entry.note && <p className="mt-1 leading-relaxed">{entry.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
