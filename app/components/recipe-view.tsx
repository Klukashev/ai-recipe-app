import { Card, PageTitle, SectionLabel, Tag } from "@/app/ui";
import type { RecipeDraft } from "@/lib/types";

/**
 * Hook-free on purpose: it renders inside the server-rendered detail page and
 * inside the client-side generator preview without needing two versions.
 */
export function RecipeView({ recipe }: { recipe: RecipeDraft }) {
  return (
    <article className="space-y-8">
      <header className="space-y-3">
        <PageTitle>{recipe.title}</PageTitle>
        {recipe.summary && (
          <p className="text-muted leading-relaxed">{recipe.summary}</p>
        )}
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
          <div className="flex gap-1.5">
            <dt className="text-muted">Serves</dt>
            <dd className="font-medium">{recipe.servings}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-muted">Time</dt>
            <dd className="font-medium">{recipe.totalMinutes} min</dd>
          </div>
        </dl>
        {recipe.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 pt-1">
            {recipe.tags.map((tag) => (
              <li key={tag}>
                <Tag>{tag}</Tag>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="space-y-3">
          <SectionLabel>Ingredients</SectionLabel>
          <ul className="space-y-2 text-sm leading-relaxed">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={`${ingredient}-${index}`} className="flex gap-2.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-accent" />
                <span>{ingredient}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <SectionLabel>Method</SectionLabel>
          <ol className="space-y-4">
            {recipe.steps.map((step, index) => (
              <li key={`${index}-${step.slice(0, 12)}`} className="flex gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-soft font-mono text-xs font-medium text-accent">
                  {index + 1}
                </span>
                <p className="leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {recipe.tips.length > 0 && (
        <Card className="space-y-3">
          <SectionLabel>Notes</SectionLabel>
          <ul className="space-y-2 text-sm leading-relaxed text-muted">
            {recipe.tips.map((tip, index) => (
              <li key={`${index}-${tip.slice(0, 12)}`}>{tip}</li>
            ))}
          </ul>
        </Card>
      )}

      {recipe.sourceIngredients.length > 0 && (
        <p className="text-xs text-muted">
          Generated from: {recipe.sourceIngredients.join(", ")}
        </p>
      )}
    </article>
  );
}
