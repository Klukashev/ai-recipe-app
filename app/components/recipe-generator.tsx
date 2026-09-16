"use client";

import { useRef, useState, useTransition } from "react";

import { generateAction, saveDraftAction, type GenerateResult } from "@/app/actions";
import { DIETS, MEALS, type Diet, type Meal } from "@/lib/types";
import { RecipeView } from "./recipe-view";
import { usePantry } from "./use-pantry";

const SUGGESTIONS = [
  "eggs",
  "chicken breast",
  "rice",
  "pasta",
  "onion",
  "garlic",
  "tomatoes",
  "cheddar",
  "spinach",
  "potatoes",
  "chickpeas",
  "mushrooms",
];

const TIME_OPTIONS = [15, 30, 45, 60, 90];

const field =
  "w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-accent";

export function RecipeGenerator() {
  const [ingredients, setIngredients] = usePantry();
  const [entry, setEntry] = useState("");
  const [meal, setMeal] = useState<Meal>("dinner");
  const [servings, setServings] = useState(2);
  const [maxMinutes, setMaxMinutes] = useState(30);
  const [diets, setDiets] = useState<Diet[]>([]);
  const [notes, setNotes] = useState("");

  const [result, setResult] = useState<GenerateResult>({ status: "idle" });
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  const resultRef = useRef<HTMLDivElement>(null);

  function parse(raw: string): string[] {
    return raw
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);
  }

  /**
   * Fold whatever is sitting in the text box into the chip list and return the
   * result. Generating calls this too: text you typed but didn't press Enter on
   * is still part of what's in your fridge, and silently dropping it meant you
   * could cook from a stale list without noticing.
   */
  function commitEntry(): string[] {
    const additions = parse(entry);
    if (additions.length === 0) return ingredients;
    const next = [...new Set([...ingredients, ...additions])];
    setIngredients(next);
    setEntry("");
    return next;
  }

  function removeIngredient(target: string) {
    setIngredients(ingredients.filter((item) => item !== target));
  }

  function toggleDiet(diet: Diet) {
    setDiets((current) =>
      current.includes(diet)
        ? current.filter((item) => item !== diet)
        : [...current, diet],
    );
  }

  /** `avoid` carries the dish kind already on screen, so "Try another" actually
   *  reaches for something different rather than re-rolling the same winner. */
  function generate(avoid: string[] = []) {
    const list = commitEntry();
    if (list.length === 0) return;
    startGenerating(async () => {
      const next = await generateAction({
        ingredients: list,
        meal,
        servings,
        maxMinutes,
        diets,
        notes,
        avoid,
      });
      setResult(next);
      if (next.status === "ready") {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  function save() {
    if (result.status !== "ready") return;
    const draft = result.draft;
    startSaving(async () => {
      // This action redirects to the saved recipe, so nothing follows it.
      await saveDraftAction(draft);
    });
  }

  const unusedSuggestions = SUGGESTIONS.filter((item) => !ingredients.includes(item));

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            What&apos;s in your fridge?
          </h1>
          <p className="max-w-xl text-muted leading-relaxed">
            List what you&apos;ve actually got. You&apos;ll get one recipe built around it —
            keep it, edit it, or generate another.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-edge bg-card p-5">
          <div className="space-y-2">
            <label htmlFor="ingredient" className="block text-sm font-medium">
              Ingredients
            </label>
            <div className="flex gap-2">
              <input
                id="ingredient"
                value={entry}
                onChange={(event) => setEntry(event.target.value)}
                onKeyDown={(event) => {
                  // Commas are a separator you type, not a commit key —
                  // `commitEntry` splits on them when you press Enter.
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitEntry();
                  }
                  if (event.key === "Backspace" && entry === "" && ingredients.length > 0) {
                    removeIngredient(ingredients[ingredients.length - 1]);
                  }
                }}
                placeholder="half a cabbage, 3 eggs, leftover rice…"
                className={field}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => commitEntry()}
                className="shrink-0 rounded-lg border border-edge px-3 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-muted">
              Separate several with commas. Press Enter to add them — or just hit
              Generate, and whatever is still in the box is included too.
            </p>
          </div>

          {ingredients.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-muted">
                  Cooking with {ingredients.length}{" "}
                  {ingredients.length === 1 ? "ingredient" : "ingredients"}
                </span>
                <button
                  type="button"
                  onClick={() => setIngredients([])}
                  className="text-xs text-muted underline-offset-2 transition-colors hover:text-accent hover:underline"
                >
                  Clear all
                </button>
              </div>
              <ul className="flex flex-wrap gap-1.5">
                {ingredients.map((item) => (
                  <li key={item}>
                    <button
                      type="button"
                      onClick={() => removeIngredient(item)}
                      className="group flex items-center gap-1.5 rounded-full bg-accent/12 px-3 py-1 text-sm text-accent transition-colors hover:bg-accent/25"
                      aria-label={`Remove ${item}`}
                    >
                      {item}
                      <span aria-hidden className="opacity-50 group-hover:opacity-100">
                        ×
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          {unusedSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-edge pt-4">
              <span className="text-xs text-muted">Usually around:</span>
              {unusedSuggestions.slice(0, 8).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setIngredients([...new Set([...ingredients, item])])}
                  className="rounded-full border border-edge px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  + {item}
                </button>
              ))}
            </div>
          )}
        </div>

        {/*
          The primary action sits directly under the ingredient list. Nothing
          generates on its own, so the button has to be the first thing you see
          after listing your fridge — not something found by scrolling past the
          optional settings below it.
        */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button
            type="button"
            onClick={() => generate()}
            disabled={isGenerating || (ingredients.length === 0 && parse(entry).length === 0)}
            className="rounded-full bg-accent px-6 py-3 text-base font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isGenerating ? "Thinking…" : "Generate a recipe"}
          </button>
          {ingredients.length === 0 && parse(entry).length === 0 ? (
            <span className="text-sm text-muted">Add an ingredient to start.</span>
          ) : (
            // Echo the settings from below, so the top of the page tells you
            // what you're about to cook without scrolling down to check.
            <span className="text-sm text-muted">
              {[meal, `serves ${servings}`, `${maxMinutes} min`, ...diets].join(" · ")}
            </span>
          )}
        </div>

        <div className="space-y-6 border-t border-edge pt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Fine-tune <span className="font-normal normal-case tracking-normal">(optional)</span>
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label htmlFor="meal" className="block text-sm font-medium">
                Meal
              </label>
              <select
                id="meal"
                value={meal}
                onChange={(event) => setMeal(event.target.value as Meal)}
                className={field}
              >
                {MEALS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="servings" className="block text-sm font-medium">
                Servings
              </label>
              <input
                id="servings"
                type="number"
                min={1}
                max={12}
                value={servings}
                onChange={(event) => setServings(Number(event.target.value))}
                className={field}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="time" className="block text-sm font-medium">
                Time I have
              </label>
              <select
                id="time"
                value={maxMinutes}
                onChange={(event) => setMaxMinutes(Number(event.target.value))}
                className={field}
              >
                {TIME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} minutes
                  </option>
                ))}
              </select>
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Dietary</legend>
            <div className="flex flex-wrap gap-1.5">
              {DIETS.map((diet) => {
                const active = diets.includes(diet);
                return (
                  <button
                    key={diet}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggleDiet(diet)}
                    className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                      active
                        ? "border-accent bg-accent/12 text-accent"
                        : "border-edge text-muted hover:border-accent hover:text-accent"
                    }`}
                  >
                    {diet}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <label htmlFor="notes" className="block text-sm font-medium">
              Anything else?
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="no oven, something spicy, the kids are eating too…"
              className={`${field} resize-y`}
            />
          </div>
        </div>

        {result.status === "error" && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {result.message}
          </p>
        )}
      </section>

      <div ref={resultRef}>
        {result.status === "ready" && (
          <section className="space-y-6 rounded-2xl border border-edge bg-card p-6 sm:p-8">
            <RecipeView recipe={result.draft} />

            <div className="flex flex-wrap gap-3 border-t border-edge pt-6">
              <button
                type="button"
                onClick={save}
                disabled={isSaving}
                className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSaving ? "Saving…" : "Save to my recipes"}
              </button>
              <button
                type="button"
                onClick={() => generate([result.draft.kind])}
                disabled={isGenerating}
                className="rounded-full border border-edge px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
              >
                {isGenerating ? "Thinking…" : "Try another"}
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
