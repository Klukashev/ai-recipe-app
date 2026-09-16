"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateRecipe } from "@/lib/ai";
import {
  createRecipe,
  deleteRecipe as deleteFromStore,
  updateRecipe as updateInStore,
} from "@/lib/store";
import {
  DIETS,
  MEALS,
  type Diet,
  type GenerateInput,
  type Meal,
  type RecipeDraft,
  type RecipeEdit,
} from "@/lib/types";

export type GenerateResult =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "ready"; draft: RecipeDraft };

function clamp(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function cleanList(values: unknown, limit: number): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * Server actions are reachable by direct POST, not just through the UI, so
 * everything crossing this boundary is re-validated here rather than trusted
 * from the client component that sent it.
 */
function sanitizeInput(raw: GenerateInput): GenerateInput {
  return {
    ingredients: cleanList(raw?.ingredients, 40),
    meal: MEALS.includes(raw?.meal as Meal) ? raw.meal : "dinner",
    servings: clamp(Number(raw?.servings), 1, 12, 2),
    maxMinutes: clamp(Number(raw?.maxMinutes), 10, 240, 30),
    diets: cleanList(raw?.diets, DIETS.length).filter((diet): diet is Diet =>
      DIETS.includes(diet as Diet),
    ),
    notes: typeof raw?.notes === "string" ? raw.notes.trim().slice(0, 400) : "",
    avoid: cleanList(raw?.avoid, 10),
  };
}

export async function generateAction(
  raw: GenerateInput,
): Promise<GenerateResult> {
  const input = sanitizeInput(raw);

  if (input.ingredients.length === 0) {
    return {
      status: "error",
      message: "Add at least one ingredient so there's something to cook with.",
    };
  }

  try {
    const draft = await generateRecipe(input);
    return { status: "ready", draft };
  } catch (error) {
    console.error("Recipe generation failed:", error);
    return {
      status: "error",
      message:
        "The generator failed. Check the server console for details and try again.",
    };
  }
}

function sanitizeDraft(raw: RecipeDraft): RecipeDraft {
  return {
    kind: String(raw?.kind ?? "").trim().slice(0, 40),
    title: String(raw?.title ?? "Untitled recipe").trim().slice(0, 140),
    summary: String(raw?.summary ?? "").trim().slice(0, 600),
    servings: clamp(Number(raw?.servings), 1, 12, 2),
    totalMinutes: clamp(Number(raw?.totalMinutes), 1, 600, 30),
    tags: cleanList(raw?.tags, 12),
    ingredients: cleanList(raw?.ingredients, 60),
    steps: cleanList(raw?.steps, 40),
    tips: cleanList(raw?.tips, 15),
    sourceIngredients: cleanList(raw?.sourceIngredients, 40),
    generatedBy: String(raw?.generatedBy ?? "unknown").slice(0, 60),
  };
}

export async function saveDraftAction(raw: RecipeDraft): Promise<never> {
  const recipe = await createRecipe(sanitizeDraft(raw));
  revalidatePath("/recipes");
  // redirect throws a control-flow exception, so nothing after it runs.
  redirect(`/recipes/${recipe.id}`);
}

export type SaveState = { status: "idle" | "saved" | "error"; message?: string };

export async function updateRecipeAction(
  id: string,
  raw: RecipeEdit,
): Promise<SaveState> {
  const edit: RecipeEdit = {
    title: String(raw?.title ?? "").trim().slice(0, 140),
    summary: String(raw?.summary ?? "").trim().slice(0, 600),
    servings: clamp(Number(raw?.servings), 1, 12, 2),
    totalMinutes: clamp(Number(raw?.totalMinutes), 1, 600, 30),
    tags: cleanList(raw?.tags, 12),
    ingredients: cleanList(raw?.ingredients, 60),
    steps: cleanList(raw?.steps, 40),
    tips: cleanList(raw?.tips, 15),
  };

  if (!edit.title) {
    return { status: "error", message: "A recipe needs a title." };
  }
  if (edit.ingredients.length === 0) {
    return { status: "error", message: "A recipe needs at least one ingredient." };
  }

  const updated = await updateInStore(id, edit);
  if (!updated) {
    return { status: "error", message: "That recipe no longer exists." };
  }

  revalidatePath("/recipes");
  revalidatePath(`/recipes/${id}`);
  return { status: "saved" };
}

export async function deleteRecipeAction(id: string): Promise<never> {
  await deleteFromStore(id);
  revalidatePath("/recipes");
  redirect("/recipes");
}
