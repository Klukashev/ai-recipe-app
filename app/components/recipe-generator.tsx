"use client";

import { useRef, useState, useTransition } from "react";

import { generateAction, saveDraftAction, type GenerateResult } from "@/app/actions";
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  PageTitle,
  RemovableChip,
  SectionLabel,
  Select,
  Textarea,
  ToggleChip,
} from "@/app/ui";
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
  const nothingToCook = ingredients.length === 0 && parse(entry).length === 0;

  return (
    <div className="space-y-10">
      <section className="space-y-6">
        <div className="space-y-2">
          <PageTitle className="sm:text-4xl">What&apos;s in your fridge?</PageTitle>
          <p className="max-w-xl text-muted leading-relaxed">
            List what you&apos;ve actually got. You&apos;ll get one recipe built around it —
            keep it, edit it, or generate another.
          </p>
        </div>

        <Card className="space-y-4">
          <Field
            htmlFor="ingredient"
            label="Ingredients"
            hint="Separate several with commas. Press Enter to add them — or just hit Generate, and whatever is still in the box is included too."
          >
            <div className="flex gap-2">
              <Input
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
                autoComplete="off"
              />
              <Button variant="secondary" onClick={() => commitEntry()} className="shrink-0">
                Add
              </Button>
            </div>
          </Field>

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
                    <RemovableChip
                      onRemove={() => removeIngredient(item)}
                      removeLabel={`Remove ${item}`}
                    >
                      {item}
                    </RemovableChip>
                  </li>
                ))}
              </ul>
            </>
          )}

          {unusedSuggestions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 border-t border-edge pt-4">
              <span className="text-xs text-muted">Usually around:</span>
              {unusedSuggestions.slice(0, 8).map((item) => (
                <ToggleChip
                  key={item}
                  size="sm"
                  pressed={false}
                  onToggle={() => setIngredients([...new Set([...ingredients, item])])}
                >
                  + {item}
                </ToggleChip>
              ))}
            </div>
          )}
        </Card>

        {/*
          The primary action sits directly under the ingredient list. Nothing
          generates on its own, so the button has to be the first thing you see
          after listing your fridge — not something found by scrolling past the
          optional settings below it.
        */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button size="lg" onClick={() => generate()} disabled={isGenerating || nothingToCook}>
            {isGenerating ? "Thinking…" : "Generate a recipe"}
          </Button>
          {nothingToCook ? (
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
          <SectionLabel>
            Fine-tune <span className="font-normal normal-case tracking-normal">(optional)</span>
          </SectionLabel>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field htmlFor="meal" label="Meal">
              <Select
                id="meal"
                value={meal}
                onChange={(event) => setMeal(event.target.value as Meal)}
              >
                {MEALS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </Field>

            <Field htmlFor="servings" label="Servings">
              <Input
                id="servings"
                type="number"
                min={1}
                max={12}
                value={servings}
                onChange={(event) => setServings(Number(event.target.value))}
              />
            </Field>

            <Field htmlFor="time" label="Time I have">
              <Select
                id="time"
                value={maxMinutes}
                onChange={(event) => setMaxMinutes(Number(event.target.value))}
              >
                {TIME_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option} minutes
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Dietary</legend>
            <div className="flex flex-wrap gap-1.5">
              {DIETS.map((diet) => (
                <ToggleChip
                  key={diet}
                  pressed={diets.includes(diet)}
                  onToggle={() => toggleDiet(diet)}
                >
                  {diet}
                </ToggleChip>
              ))}
            </div>
          </fieldset>

          <Field htmlFor="notes" label="Anything else?">
            <Textarea
              id="notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="no oven, something spicy, the kids are eating too…"
            />
          </Field>
        </div>

        {result.status === "error" && <Alert>{result.message}</Alert>}
      </section>

      <div ref={resultRef}>
        {result.status === "ready" && (
          <Card padding="lg" className="space-y-6">
            <RecipeView recipe={result.draft} />

            <div className="flex flex-wrap gap-3 border-t border-edge pt-6">
              <Button onClick={save} disabled={isSaving}>
                {isSaving ? "Saving…" : "Save to my recipes"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => generate([result.draft.kind])}
                disabled={isGenerating}
              >
                {isGenerating ? "Thinking…" : "Try another"}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
