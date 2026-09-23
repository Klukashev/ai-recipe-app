"use client";

import { useState } from "react";

import { Badge, Card, PageTitle, SectionLabel, Tag } from "@/app/ui";
import { formatIngredient, missingFrom } from "@/lib/ingredients";
import { checkSafety } from "@/lib/safety";
import type { CookEntry, RecipeDraft } from "@/lib/types";
import { usePantry } from "./use-pantry";
import { SafetyNotes } from "./safety-notes";

/**
 * Renders a recipe, whether it's a fresh draft in the generator preview or a
 * saved one on its own page.
 *
 * Three things here exist because of what the ingredient structure unlocked:
 * the servings scaler, the "what am I missing" shopping list, and the safety
 * pass — none of which are possible when an ingredient is just a string.
 */
export function RecipeView({
  recipe,
  cookLog = [],
}: {
  recipe: RecipeDraft;
  /** Omitted for a draft, which is untested by definition. */
  cookLog?: CookEntry[];
}) {
  const [servings, setServings] = useState(recipe.servings);
  const [showMissing, setShowMissing] = useState(false);
  const [pantry] = usePantry();

  const scale = recipe.servings > 0 ? servings / recipe.servings : 1;
  const safety = checkSafety(recipe);
  const missing = missingFrom(pantry, recipe.ingredients);
  const cooked = cookLog.length;

  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {cooked === 0 ? (
            // Said plainly, on purpose. A generated recipe that nobody has
            // cooked is exactly that, and pretending otherwise is the thing
            // people have learned to distrust about AI recipes.
            <Badge>Untested — nobody has cooked this yet</Badge>
          ) : (
            <Badge tone="accent">
              Cooked {cooked}
              {cooked === 1 ? " time" : " times"}
            </Badge>
          )}
          {safety.some((note) => note.severity === "danger") && (
            <Badge tone="danger">Safety note</Badge>
          )}
        </div>

        <PageTitle>{recipe.title}</PageTitle>
        {recipe.summary && (
          <p className="text-muted leading-relaxed">{recipe.summary}</p>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted">Serves</span>
            <div className="flex items-center gap-1 rounded-full border border-edge p-0.5">
              <button
                type="button"
                onClick={() => setServings(Math.max(1, servings - 1))}
                disabled={servings <= 1}
                aria-label="One fewer serving"
                className="size-6 rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-30"
              >
                −
              </button>
              <span className="min-w-6 text-center font-medium tabular-nums">
                {servings}
              </span>
              <button
                type="button"
                onClick={() => setServings(Math.min(12, servings + 1))}
                disabled={servings >= 12}
                aria-label="One more serving"
                className="size-6 rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-30"
              >
                +
              </button>
            </div>
            {scale !== 1 && (
              <button
                type="button"
                onClick={() => setServings(recipe.servings)}
                className="text-xs text-muted underline underline-offset-2 hover:text-accent"
              >
                reset
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            <span className="text-muted">Time</span>
            <span className="font-medium">{recipe.totalMinutes} min</span>
          </div>
        </div>

        {recipe.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {recipe.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        )}
      </header>

      <SafetyNotes notes={safety} />

      <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <SectionLabel>Ingredients</SectionLabel>
            {scale !== 1 && (
              <span className="text-xs text-muted">scaled ×{Math.round(scale * 100) / 100}</span>
            )}
          </div>

          <ul className="space-y-2 text-sm leading-relaxed">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={`${ingredient.item}-${index}`} className="flex gap-2.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{formatIngredient(ingredient, scale)}</span>
              </li>
            ))}
          </ul>

          {/* The fridge list is already in the browser, so working out what you
              still need to buy costs nothing extra. */}
          {pantry.length > 0 && (
            <div className="border-t border-edge pt-3">
              {missing.length === 0 ? (
                <p className="text-xs text-accent">
                  You have everything for this.
                </p>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setShowMissing(!showMissing)}
                    className="text-xs text-muted underline underline-offset-2 transition-colors hover:text-accent"
                    aria-expanded={showMissing}
                  >
                    {showMissing ? "Hide" : "Show"} shopping list — {missing.length}{" "}
                    {missing.length === 1 ? "item" : "items"} you don&apos;t have
                  </button>
                  {showMissing && (
                    <ul className="mt-3 space-y-1.5">
                      {missing.map((ingredient, index) => (
                        <li
                          key={`${ingredient.item}-${index}`}
                          className="flex items-start gap-2 text-sm"
                        >
                          <span aria-hidden className="text-muted">☐</span>
                          <span>{formatIngredient(ingredient, scale)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionLabel>Method</SectionLabel>
          <ol className="space-y-4">
            {recipe.steps.map((step, index) => (
              <li key={`${index}-${step.slice(0, 12)}`} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-medium text-accent">
                  {index + 1}
                </span>
                <p className="leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.tips.length > 0 && (
        <Card className="space-y-3">
          <SectionLabel>Notes</SectionLabel>
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            {recipe.tips.map((tip, index) => (
              <li key={`${index}-${tip.slice(0, 12)}`}>{tip}</li>
            ))}
          </ul>
        </Card>
      )}

      {recipe.sourceIngredients.length > 0 && (
        <p className="text-xs text-muted">
          Generated from: {recipe.sourceIngredients.join(", ")}
        </p>
      )}
    </article>
  );
}
