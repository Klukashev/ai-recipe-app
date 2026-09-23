import Link from "next/link";
import { connection } from "next/server";

import { listRecipes } from "@/lib/store";
import { buttonStyles, Card, PageTitle } from "@/app/ui";

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
        <PageTitle>My recipes</PageTitle>
        <p className="text-sm text-muted">
          {recipes.length} saved{recipes.length === 1 ? " recipe" : " recipes"}
        </p>
      </div>

      {recipes.length === 0 ? (
        <Card hollow padding="lg" className="text-center">
          <p className="text-muted">Nothing saved yet.</p>
          <Link href="/" className={buttonStyles({ className: "mt-4" })}>
            Generate your first recipe
          </Link>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {recipes.map((recipe) => (
            <li key={recipe.id}>
              <Link href={`/recipes/${recipe.id}`} className="block h-full">
                <Card interactive className="flex h-full flex-col gap-3">
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
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
