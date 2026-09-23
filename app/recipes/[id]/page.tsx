import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";

import { getRecipe } from "@/lib/store";
import { RecipeDetail } from "@/app/components/recipe-detail";

export default async function RecipePage(props: PageProps<"/recipes/[id]">) {
  await connection();
  const { id } = await props.params;
  const [recipe, search] = await Promise.all([getRecipe(id), props.searchParams]);

  if (!recipe) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
      >
        <span aria-hidden>←</span> All recipes
      </Link>
      {/* Cook mode finishes by sending you here with the log form already open. */}
      <RecipeDetail recipe={recipe} justCooked={search.cooked === "1"} />
    </div>
  );
}
