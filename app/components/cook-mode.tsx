"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button, Card, SectionLabel } from "@/app/ui";
import { formatIngredient } from "@/lib/ingredients";
import { findMinutes, formatClock } from "@/lib/steps";
import type { Recipe } from "@/lib/types";

/**
 * The kitchen view: one step at a time, large type, screen kept awake.
 *
 * Reading a recipe on a phone while cooking is a different job from browsing
 * one — your hands are wet, the screen keeps sleeping, and you lose your place
 * in a wall of text. This mode exists for that ten minutes.
 */

export function CookMode({ recipe }: { recipe: Recipe }) {
  const [index, setIndex] = useState(0);
  const [showIngredients, setShowIngredients] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  const step = recipe.steps[index] ?? "";
  const suggestedMinutes = findMinutes(step);
  const isLast = index === recipe.steps.length - 1;

  /**
   * Keep the screen on. Wake Lock is unsupported in some browsers and is
   * released whenever the tab is hidden, so it's re-acquired on visibility
   * change rather than requested once.
   */
  const lockRef = useRef<WakeLockSentinel | null>(null);
  useEffect(() => {
    let cancelled = false;

    async function acquire() {
      if (!("wakeLock" in navigator)) return;
      try {
        const lock = await navigator.wakeLock.request("screen");
        if (cancelled) {
          void lock.release();
          return;
        }
        lockRef.current = lock;
      } catch {
        // Denied or unsupported — cooking still works, the screen just dims.
      }
    }

    function onVisibility() {
      if (document.visibilityState === "visible") void acquire();
    }

    void acquire();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibility);
      void lockRef.current?.release();
      lockRef.current = null;
    };
  }, []);

  // The timer ticks down and then announces itself.
  useEffect(() => {
    if (remaining === null) return;
    if (remaining <= 0) return;
    const id = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(id);
  }, [remaining]);

  const go = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(next, 0), recipe.steps.length - 1);
      setIndex(clamped);
      setRemaining(null); // A timer belongs to the step that started it.
    },
    [recipe.steps.length],
  );

  // Arrow keys, because a laptop propped on the counter is a real way to cook.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight" || event.key === " ") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  const done = remaining !== null && remaining <= 0;

  return (
    <div className="flex min-h-[70vh] flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/recipes/${recipe.id}`}
          className="text-sm text-muted underline-offset-2 transition-colors hover:text-accent hover:underline"
        >
          ← Leave cook mode
        </Link>
        <button
          type="button"
          onClick={() => setShowIngredients(!showIngredients)}
          aria-expanded={showIngredients}
          className="text-sm text-muted underline-offset-2 transition-colors hover:text-accent hover:underline"
        >
          {showIngredients ? "Hide" : "Show"} ingredients
        </button>
      </div>

      {showIngredients && (
        <Card className="space-y-2">
          <SectionLabel>Ingredients</SectionLabel>
          <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
            {recipe.ingredients.map((ingredient, i) => (
              <li key={`${ingredient.item}-${i}`}>{formatIngredient(ingredient)}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Progress: which of how many, as a bar you can also click. */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between text-sm text-muted">
          <span>
            Step {index + 1} of {recipe.steps.length}
          </span>
          <span className="truncate pl-4">{recipe.title}</span>
        </div>
        <ol className="flex gap-1">
          {recipe.steps.map((_, i) => (
            <li key={i} className="flex-1">
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Go to step ${i + 1}`}
                aria-current={i === index}
                className={`h-1.5 w-full rounded-full transition-colors ${
                  i <= index ? "bg-accent" : "bg-edge"
                }`}
              />
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-1 flex-col justify-center py-4">
        <p className="text-2xl leading-relaxed text-balance sm:text-3xl sm:leading-relaxed">
          {step}
        </p>

        {suggestedMinutes !== null && (
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {remaining === null ? (
              <Button
                variant="secondary"
                onClick={() => setRemaining(suggestedMinutes * 60)}
              >
                Start {suggestedMinutes} min timer
              </Button>
            ) : (
              <>
                <span
                  aria-live="polite"
                  className={`font-mono text-3xl tabular-nums ${
                    done ? "text-accent" : "text-foreground"
                  }`}
                >
                  {done ? "Time's up" : formatClock(remaining)}
                </span>
                <Button variant="ghost" size="sm" onClick={() => setRemaining(null)}>
                  {done ? "Clear" : "Stop"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 border-t border-edge pt-6">
        <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}>
          Back
        </Button>
        {isLast ? (
          <Link href={`/recipes/${recipe.id}?cooked=1`} className="flex-1 sm:flex-none">
            <Button size="lg" className="w-full">
              Finished — log it
            </Button>
          </Link>
        ) : (
          <Button size="lg" onClick={() => go(index + 1)} className="flex-1 sm:flex-none">
            Next step
          </Button>
        )}
      </div>
    </div>
  );
}
