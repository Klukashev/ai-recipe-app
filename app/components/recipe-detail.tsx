"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { deleteRecipeAction, updateRecipeAction } from "@/app/actions";
import { Alert, Button, Field, Input, PageTitle, Textarea } from "@/app/ui";
import type { Recipe, RecipeEdit } from "@/lib/types";
import { RecipeView } from "./recipe-view";

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

/** Monospace keeps the one-per-line structure obvious while editing. */
const LINES = "font-mono text-xs leading-relaxed";

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
          <Button onClick={() => setEditing(true)}>Edit recipe</Button>
          <Button variant="danger" onClick={remove} disabled={isDeleting}>
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
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
      <PageTitle className="text-2xl">Editing recipe</PageTitle>

      <Field htmlFor="title" label="Title">
        <Input
          id="title"
          value={form.title}
          onChange={(event) => set("title", event.target.value)}
        />
      </Field>

      <Field htmlFor="summary" label="Summary">
        <Textarea
          id="summary"
          rows={2}
          value={form.summary}
          onChange={(event) => set("summary", event.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field htmlFor="edit-servings" label="Servings">
          <Input
            id="edit-servings"
            type="number"
            min={1}
            max={12}
            value={form.servings}
            onChange={(event) => set("servings", Number(event.target.value))}
          />
        </Field>
        <Field htmlFor="edit-minutes" label="Minutes">
          <Input
            id="edit-minutes"
            type="number"
            min={1}
            max={600}
            value={form.totalMinutes}
            onChange={(event) => set("totalMinutes", Number(event.target.value))}
          />
        </Field>
        <Field htmlFor="edit-tags" label="Tags">
          <Input
            id="edit-tags"
            value={form.tags}
            onChange={(event) => set("tags", event.target.value)}
            placeholder="comma separated"
          />
        </Field>
      </div>

      <Field
        htmlFor="edit-ingredients"
        label={
          <>
            Ingredients <span className="font-normal text-muted">— one per line</span>
          </>
        }
      >
        <Textarea
          id="edit-ingredients"
          rows={Math.max(6, recipe.ingredients.length + 1)}
          value={form.ingredients}
          onChange={(event) => set("ingredients", event.target.value)}
          className={LINES}
        />
      </Field>

      <Field
        htmlFor="edit-steps"
        label={
          <>
            Method <span className="font-normal text-muted">— one step per line</span>
          </>
        }
      >
        <Textarea
          id="edit-steps"
          rows={Math.max(8, recipe.steps.length + 2)}
          value={form.steps}
          onChange={(event) => set("steps", event.target.value)}
          className={LINES}
        />
      </Field>

      <Field
        htmlFor="edit-tips"
        label={
          <>
            Notes <span className="font-normal text-muted">— one per line</span>
          </>
        }
      >
        <Textarea
          id="edit-tips"
          rows={4}
          value={form.tips}
          onChange={(event) => set("tips", event.target.value)}
          className={LINES}
        />
      </Field>

      {error && <Alert>{error}</Alert>}

      <div className="flex flex-wrap gap-3 border-t border-edge pt-5">
        <Button onClick={save} disabled={isSaving}>
          {isSaving ? "Saving…" : "Save changes"}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setEditing(false);
            setError(null);
          }}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
