import Link from "next/link";
import { connection } from "next/server";

import { listRecipes } from "@/lib/store";

export const metadata = {
  title: "My recipes — Fridge Chef",
};

export default async function RecipesPage() {
  // The recipe file is read from disk with a synchronous-feeling API that would
  // otherwise be baked into the prerender at build time. Wait for a real
  // request so the list is always current.
  await connection();
  const recipes = await listRecipes();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-3xl font-semibold tracking-tight">My recipes</h1>
        <p className="text-sm text-muted">
          {recipes.length} saved{recipes.length === 1 ? " recipe" : " recipes"}
        </p>
      </div>

      {recipes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-edge p-10 text-center">
          <p className="text-muted">Nothing saved yet.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Generate your first recipe
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link
                href={`/recipes/${recipe.id}`}
                className="flex h-full flex-col gap-3 rounded-xl border border-edge bg-card p-5 transition-colors hover:border-accent"
              >
                <h2 className="font-semibold leading-snug text-balance">
                  {recipe.title}
                </h2>
                {recipe.summary && (
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted">
                    {recipe.summary}
                  </p>
                )}
                <p className="mt-auto text-xs text-muted">
                  Serves {recipe.servings} · {recipe.totalMinutes} min ·{" "}
                  {recipe.ingredients.length} ingredients
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
