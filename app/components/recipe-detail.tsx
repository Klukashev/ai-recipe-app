"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteRecipeAction, updateRecipeAction } from "@/app/actions";
import type { Recipe, RecipeEdit } from "@/lib/types";
import { RecipeView } from "./recipe-view";

const field =
  "w-full rounded-lg border border-edge bg-card px-3 py-2 text-sm outline-none transition-colors focus:border-accent";

/** Multi-line fields are edited as one item per line — the simplest thing that
 *  lets you reorder and rewrite steps without a drag-and-drop list. */
function toLines(values: string[]): string {
  return values.join("\n");
}

function fromLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export function RecipeDetail({ recipe }: { recipe: Recipe }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const [form, setForm] = useState({
    title: recipe.title,
    summary: recipe.summary,
    servings: recipe.servings,
    totalMinutes: recipe.totalMinutes,
    tags: recipe.tags.join(", "),
    ingredients: toLines(recipe.ingredients),
    steps: toLines(recipe.steps),
    tips: toLines(recipe.tips),
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function save() {
    setError(null);
    const edit: RecipeEdit = {
      title: form.title,
      summary: form.summary,
      servings: Number(form.servings),
      totalMinutes: Number(form.totalMinutes),
      tags: form.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      ingredients: fromLines(form.ingredients),
      steps: fromLines(form.steps),
      tips: fromLines(form.tips),
    };

    startSaving(async () => {
      const result = await updateRecipeAction(recipe.id, edit);
      if (result.status === "error") {
        setError(result.message ?? "Could not save.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  function remove() {
    if (!window.confirm(`Delete "${recipe.title}"? This can't be undone.`)) return;
    startDeleting(async () => {
      // Redirects to /recipes on success.
      await deleteRecipeAction(recipe.id);
    });
  }

  if (!editing) {
    return (
      <div className="space-y-8">
        <RecipeView recipe={recipe} />

        <div className="flex flex-wrap items-center gap-3 border-t border-edge pt-6">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Edit recipe
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={isDeleting}
            className="rounded-full border border-edge px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-red-500 hover:text-red-500 disabled:opacity-50"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </button>
          <span className="text-xs text-muted">
            Saved {new Date(recipe.createdAt).toLocaleDateString()}
            {recipe.updatedAt !== recipe.createdAt &&
              ` · edited ${new Date(recipe.updatedAt).toLocaleDateString()}`}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Editing recipe</h1>

      <div className="space-y-1.5">
        <label htmlFor="title" className="block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          value={form.title}
          onChange={(event) => set("title", event.target.value)}
          className={field}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="summary" className="block text-sm font-medium">
          Summary
        </label>
        <textarea
          id="summary"
          rows={2}
          value={form.summary}
          onChange={(event) => set("summary", event.target.value)}
          className={`${field} resize-y`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="edit-servings" className="block text-sm font-medium">
            Servings
          </label>
          <input
            id="edit-servings"
            type="number"
            min={1}
            max={12}
            value={form.servings}
            onChange={(event) => set("servings", Number(event.target.value))}
            className={field}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="edit-minutes" className="block text-sm font-medium">
            Minutes
          </label>
          <input
            id="edit-minutes"
            type="number"
            min={1}
            max={600}
            value={form.totalMinutes}
            onChange={(event) => set("totalMinutes", Number(event.target.value))}
            className={field}
          />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="edit-tags" className="block text-sm font-medium">
            Tags
          </label>
          <input
            id="edit-tags"
            value={form.tags}
            onChange={(event) => set("tags", event.target.value)}
            placeholder="comma separated"
            className={field}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-ingredients" className="block text-sm font-medium">
          Ingredients <span className="font-normal text-muted">— one per line</span>
        </label>
        <textarea
          id="edit-ingredients"
          rows={Math.max(6, recipe.ingredients.length + 1)}
          value={form.ingredients}
          onChange={(event) => set("ingredients", event.target.value)}
          className={`${field} resize-y font-mono text-xs leading-relaxed`}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-steps" className="block text-sm font-medium">
          Method <span className="font-normal text-muted">— one step per line</span>
        </label>
        <textarea
          id="edit-steps"
          rows={Math.max(8, recipe.steps.length + 2)}
          value={form.steps}
          onChange={(event) => set("steps", event.target.value)}
          className={`${field} resize-y font-mono text-xs leading-relaxed`}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-tips" className="block text-sm font-medium">
          Notes <span className="font-normal text-muted">— one per line</span>
        </label>
        <textarea
          id="edit-tips"
          rows={4}
          value={form.tips}
          onChange={(event) => set("tips", event.target.value)}
          className={`${field} resize-y font-mono text-xs leading-relaxed`}
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-3 border-t border-edge pt-5">
        <button
          type="button"
          onClick={save}
          disabled={isSaving}
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
          className="rounded-full border border-edge px-5 py-2.5 text-sm font-medium transition-colors hover:border-accent hover:text-accent"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
