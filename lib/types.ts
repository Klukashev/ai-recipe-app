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

/** A recipe that has been generated but not yet saved. */
export type RecipeDraft = {
  /** The dish family, e.g. "stir-fry" or "traybake". Used to ask for something different. */
  kind: string;
  title: string;
  summary: string;
  servings: number;
  totalMinutes: number;
  tags: string[];
  ingredients: string[];
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
