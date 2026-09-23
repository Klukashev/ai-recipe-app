import { notFound } from "next/navigation";
import { connection } from "next/server";

import { CookMode } from "@/app/components/cook-mode";
import { getRecipe } from "@/lib/store";

export const metadata = {
  title: "Cooking — Fridge Chef",
};

export default async function CookPage(props: PageProps<"/recipes/[id]/cook">) {
  await connection();
  const { id } = await props.params;
  const recipe = await getRecipe(id);

  if (!recipe || recipe.steps.length === 0) notFound();

  return <CookMode recipe={recipe} />;
}
