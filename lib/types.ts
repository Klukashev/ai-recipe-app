export const MEALS = [
  "breakfast",
  "lunch",
  "dinner",
  "dessert",
  "snack",
] as const;

export type Meal = (typeof MEALS)[number];

export const DIETS = [
  "vegetarian",
  "vegan",
  "gluten-free",
  "dairy-free",
  "low-carb",
  "high-protein",
] as const;

export type Diet = (typeof DIETS)[number];

/** What the user tells us they have and what they want out of it. */
export type GenerateInput = {
  /** Whatever was in the fridge, one item per entry. */
  ingredients: string[];
  meal: Meal;
  servings: number;
  maxMinutes: number;
  diets: Diet[];
  /** Free-form extras: "something spicy", "no oven", "kid friendly". */
  notes: string;
  /**
   * Dish kinds to steer away from — what "Try another" sends so you don't get
   * handed the same stir-fry twice. Advisory: if avoiding them would leave
   * nothing cookable, it's ignored.
   */
  avoid?: string[];
};

/**
 * A single ingredient, broken into parts.
 *
 * Stored structured rather than as one string because a plain string is a dead
 * end: you can't halve it for fewer servings, you can't diff it against what's
 * in the fridge to build a shopping list, and you can't substitute an item
 * without regex-guessing where the item name starts.
 */
export type Ingredient = {
  /** null for "a pinch of salt" — plenty of real ingredients have no number. */
  quantity: number | null;
  /** "g", "tbsp", "clove"… Empty for countable things ("3 eggs"). */
  unit: string;
  /** The food itself: "chicken breast". This is what shopping lists match on. */
  item: string;
  /** Preparation: "finely sliced". Never scaled, never matched. */
  note: string;
};

/** One time you actually cooked something, and how it went. */
export type CookEntry = {
  /** ISO timestamp. */
  at: string;
  /** 1–5, or null if you didn't say. */
  rating: number | null;
  /** What you changed: "doubled the garlic, 20 min was plenty". */
  note: string;
};

/** A deterministic food-safety finding. See lib/safety.ts. */
export type SafetyNote = {
  /** Stable rule id, so notes can be dismissed or tested by name. */
  id: string;
  severity: "danger" | "caution";
  title: string;
  detail: string;
};

/** A recipe that has been generated but not yet saved. */
export type RecipeDraft = {
  /** The dish family, e.g. "stir-fry" or "traybake". Used to ask for something different. */
  kind: string;
  title: string;
  summary: string;
  servings: number;
  totalMinutes: number;
  tags: string[];
  ingredients: Ingredient[];
  steps: string[];
  tips: string[];
  /** The fridge contents this recipe was built from, for "cook it again" context. */
  sourceIngredients: string[];
  /** Which generator produced this, e.g. "mock" or a model id. */
  generatedBy: string;
};

export type Recipe = RecipeDraft & {
  id: string;
  createdAt: string;
  updatedAt: string;
  /**
   * Every time this was actually cooked. An empty log is the whole point: it
   * means the recipe is still untested, and the UI says so plainly rather than
   * presenting generated text as though someone had stood in a kitchen.
   */
  cookLog: CookEntry[];
};

/** The subset of a recipe the edit form is allowed to change. */
export type RecipeEdit = Pick<
  Recipe,
  | "title"
  | "summary"
  | "servings"
  | "totalMinutes"
  | "tags"
  | "ingredients"
  | "steps"
  | "tips"
>;

/** True once someone has cooked it at least once. */
export function isTested(recipe: Pick<Recipe, "cookLog">): boolean {
  return recipe.cookLog.length > 0;
}
