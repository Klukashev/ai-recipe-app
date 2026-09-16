import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Recipe, RecipeDraft, RecipeEdit } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "recipes.json");

/**
 * Every write goes through this promise chain so two concurrent requests can't
 * interleave a read-modify-write and lose a recipe.
 */
let writeQueue: Promise<unknown> = Promise.resolve();

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(work, work);
  // Keep the chain alive even if this particular write rejects.
  writeQueue = result.catch(() => {});
  return result;
}

async function readAll(): Promise<Recipe[]> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Recipe[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
}

async function writeAll(recipes: Recipe[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  // Write to a sibling temp file first, then rename, so a crash mid-write
  // can't leave a truncated recipes.json behind.
  const tmp = `${DATA_FILE}.${randomUUID()}.tmp`;
  await writeFile(tmp, `${JSON.stringify(recipes, null, 2)}\n`, "utf8");
  await rename(tmp, DATA_FILE);
}

function newestFirst(a: Recipe, b: Recipe): number {
  return b.createdAt.localeCompare(a.createdAt);
}

export async function listRecipes(): Promise<Recipe[]> {
  const recipes = await readAll();
  return recipes.sort(newestFirst);
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const recipes = await readAll();
  return recipes.find((recipe) => recipe.id === id) ?? null;
}

export async function createRecipe(draft: RecipeDraft): Promise<Recipe> {
  return enqueue(async () => {
    const now = new Date().toISOString();
    const recipe: Recipe = {
      ...draft,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    const recipes = await readAll();
    recipes.push(recipe);
    await writeAll(recipes);
    return recipe;
  });
}

export async function updateRecipe(
  id: string,
  edit: RecipeEdit,
): Promise<Recipe | null> {
  return enqueue(async () => {
    const recipes = await readAll();
    const index = recipes.findIndex((recipe) => recipe.id === id);
    if (index === -1) return null;

    const updated: Recipe = {
      ...recipes[index],
      ...edit,
      updatedAt: new Date().toISOString(),
    };
    recipes[index] = updated;
    await writeAll(recipes);
    return updated;
  });
}

export async function deleteRecipe(id: string): Promise<boolean> {
  return enqueue(async () => {
    const recipes = await readAll();
    const remaining = recipes.filter((recipe) => recipe.id !== id);
    if (remaining.length === recipes.length) return false;
    await writeAll(remaining);
    return true;
  });
}
