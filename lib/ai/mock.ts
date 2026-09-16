import type { Diet, GenerateInput, RecipeDraft } from "../types";

/**
 * A local stand-in for a real model.
 *
 * It classifies whatever the user has in the fridge, picks the dish template
 * that fits best given the meal, the time budget and the dietary constraints,
 * then writes ingredients and steps that actually reference those items. It is
 * not a language model, but it produces plausible, cookable output with zero
 * setup — which is what makes the rest of the app testable today.
 */

type Category =
  | "protein"
  | "egg"
  | "vegetable"
  | "starch"
  | "dairy"
  | "aromatic"
  | "herb"
  | "fruit"
  | "other";

const KEYWORDS: Record<Exclude<Category, "other">, string[]> = {
  protein: [
    "chicken", "beef", "pork", "lamb", "turkey", "bacon", "ham", "sausage",
    "mince", "steak", "salmon", "tuna", "cod", "shrimp", "prawn", "fish",
    "tofu", "tempeh", "chickpea", "lentil", "bean", "seitan",
  ],
  egg: ["egg", "eggs"],
  vegetable: [
    "broccoli", "carrot", "pepper", "capsicum", "courgette", "zucchini",
    "aubergine", "eggplant", "spinach", "kale", "cabbage", "cauliflower",
    "mushroom", "tomato", "cucumber", "lettuce", "pea", "peas", "corn",
    "green bean", "asparagus", "leek", "celery", "pumpkin", "squash",
    "beetroot", "radish", "sprout", "bok choy", "chard",
  ],
  starch: [
    "rice", "pasta", "spaghetti", "penne", "noodle", "potato", "bread",
    "tortilla", "wrap", "couscous", "quinoa", "bulgur", "oats", "polenta",
    "flour", "gnocchi", "barley",
  ],
  dairy: [
    "milk", "cheese", "cheddar", "parmesan", "feta", "mozzarella", "yoghurt",
    "yogurt", "cream", "butter", "ricotta", "halloumi", "mascarpone",
  ],
  aromatic: [
    "onion", "garlic", "ginger", "shallot", "spring onion", "scallion",
    "chilli", "chili", "chile", "jalapeno", "lemongrass",
  ],
  herb: [
    "basil", "parsley", "coriander", "cilantro", "thyme", "rosemary", "dill",
    "mint", "oregano", "sage", "chive",
  ],
  fruit: [
    "apple", "pear", "banana", "berry", "berries", "strawberr", "blueberr",
    "raspberr", "peach", "plum", "mango", "orange", "lemon", "lime",
    "pineapple", "rhubarb", "cherry", "cherries", "grape",
  ],
};

function classify(item: string): Category {
  const value = item.toLowerCase();
  // Order matters: "egg noodles" is a starch, "sweet potato" is a starch, and
  // tomato should not be swallowed by the fruit list.
  for (const category of [
    "starch",
    "protein",
    "egg",
    "vegetable",
    "dairy",
    "aromatic",
    "herb",
    "fruit",
  ] as const) {
    if (KEYWORDS[category].some((keyword) => value.includes(keyword))) {
      return category;
    }
  }
  return "other";
}

type Pantry = {
  input: GenerateInput;
  proteins: string[];
  eggs: string[];
  vegetables: string[];
  starches: string[];
  dairy: string[];
  aromatics: string[];
  herbs: string[];
  fruits: string[];
  others: string[];
  vegan: boolean;
  vegetarian: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  lowCarb: boolean;
};

const MEAT = [
  "chicken", "beef", "pork", "lamb", "turkey", "bacon", "ham", "sausage",
  "mince", "steak", "salmon", "tuna", "cod", "shrimp", "prawn", "fish",
];

function isAnimalProtein(item: string): boolean {
  const value = item.toLowerCase();
  return MEAT.some((meat) => value.includes(meat));
}

function buildPantry(input: GenerateInput): Pantry {
  const diets = new Set<Diet>(input.diets);
  const vegan = diets.has("vegan");
  const vegetarian = vegan || diets.has("vegetarian");

  const buckets: Record<Category, string[]> = {
    protein: [],
    egg: [],
    vegetable: [],
    starch: [],
    dairy: [],
    aromatic: [],
    herb: [],
    fruit: [],
    other: [],
  };

  for (const item of input.ingredients) {
    buckets[classify(item)].push(item);
  }

  // Respect the diet by dropping ingredients it rules out rather than cooking
  // a "vegan" recipe that opens with a chicken breast.
  const proteins = vegetarian
    ? buckets.protein.filter((item) => !isAnimalProtein(item))
    : buckets.protein;
  const eggs = vegan ? [] : buckets.egg;
  const dairy = vegan || diets.has("dairy-free") ? [] : buckets.dairy;
  const starches = diets.has("low-carb") ? [] : buckets.starch;

  return {
    input,
    proteins,
    eggs,
    vegetables: buckets.vegetable,
    starches,
    dairy,
    aromatics: buckets.aromatic,
    herbs: buckets.herb,
    fruits: buckets.fruit,
    others: buckets.other,
    vegan,
    vegetarian,
    glutenFree: diets.has("gluten-free"),
    dairyFree: vegan || diets.has("dairy-free"),
    lowCarb: diets.has("low-carb"),
  };
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

/** Dish names read better singular: "Apple Crumble", not "Apples Crumble". */
function singular(word: string): string {
  const lower = word.toLowerCase();
  if (/(ss|us|is)$/.test(lower)) return word; // asparagus, couscous, hummus
  if (lower.endsWith("ies")) return `${word.slice(0, -3)}y`; // berries -> berry
  if (lower.endsWith("oes")) return word.slice(0, -2); // potatoes -> potato
  if (lower.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** Only used for dish titles, which is why it singularizes as it goes. */
function titleCase(value: string): string {
  return value
    .split(" ")
    .map(singular)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** "carrots, peas and spinach" */
function join(items: string[], fallback = ""): string {
  const list = items.map((item) => item.toLowerCase());
  if (list.length === 0) return fallback;
  if (list.length === 1) return list[0];
  return `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`;
}

/** Scale a per-two-servings gram amount and round to something writable. */
function grams(perTwo: number, servings: number): string {
  const total = Math.round((perTwo * servings) / 2 / 10) * 10;
  return `${total} g`;
}

function has(pantry: Pantry, ...keywords: string[]): boolean {
  return pantry.input.ingredients.some((item) =>
    keywords.some((keyword) => item.toLowerCase().includes(keyword)),
  );
}

type Template = {
  id: string;
  /** Higher wins. Return 0 to rule the template out entirely. */
  score: (pantry: Pantry) => number;
  // `kind` isn't a template's job — the generator stamps it from `id` below.
  build: (
    pantry: Pantry,
  ) => Omit<RecipeDraft, "sourceIngredients" | "generatedBy" | "servings" | "kind">;
};

const SEASONING = ["salt", "black pepper", "olive oil"];

function baseTips(pantry: Pantry): string[] {
  const tips: string[] = [];
  if (pantry.herbs.length > 0) {
    tips.push(
      `Hold back half the ${join(pantry.herbs)} and scatter it on at the table — it keeps its perfume that way.`,
    );
  }
  if (pantry.input.notes.trim()) {
    tips.push(`Your note: "${pantry.input.notes.trim()}" — adjust seasoning and heat to match.`);
  }
  tips.push(
    "Taste before serving. Most dishes that feel flat need salt, acid (lemon or vinegar) or fat, in that order.",
  );
  return tips;
}

const TEMPLATES: Template[] = [
  {
    id: "stir-fry",
    score: (p) =>
      p.input.maxMinutes >= 15 && p.input.maxMinutes <= 40 && p.vegetables.length > 0
        ? 8 + p.vegetables.length + (p.proteins.length > 0 ? 2 : 0)
        : 0,
    build: (p) => {
      const hero = p.proteins[0] ?? p.eggs[0] ?? p.vegetables[0];
      const veg = p.vegetables.length > 0 ? p.vegetables : p.others;
      const aromatics = p.aromatics.length > 0 ? p.aromatics : ["garlic", "onion"];
      return {
        title: `${titleCase(hero)} and ${titleCase(veg[0] ?? "Vegetable")} Stir-Fry`,
        summary: `A hot-pan weeknight stir-fry that clears ${join([...p.proteins, ...veg].slice(0, 4))} out of the fridge in about ${p.input.maxMinutes} minutes.`,
        totalMinutes: Math.min(p.input.maxMinutes, 25),
        tags: ["stir-fry", "quick", "one-pan"],
        ingredients: [
          ...p.proteins.map((item) => `${grams(300, p.input.servings)} ${item.toLowerCase()}, sliced thin`),
          ...veg.map((item) => `${grams(200, p.input.servings)} ${item.toLowerCase()}, cut into bite-size pieces`),
          ...aromatics.map((item) => `2 cloves / 1 piece ${item.toLowerCase()}, finely chopped`),
          ...(p.starches.length > 0
            ? [`${grams(150, p.input.servings)} ${p.starches[0].toLowerCase()}, cooked, to serve`]
            : []),
          p.glutenFree ? "3 tbsp tamari (gluten-free soy sauce)" : "3 tbsp soy sauce",
          "1 tbsp neutral oil for the pan",
          "1 tsp sugar or honey",
          ...SEASONING.slice(0, 2),
        ],
        steps: [
          `Prep everything before you turn on the heat — a stir-fry gives you no time to chop halfway through. Slice the ${join([...p.proteins, ...veg], "vegetables")} and chop the ${join(aromatics)}.`,
          "Get a wide pan or wok as hot as your hob will take it, then add the oil. It should shimmer immediately.",
          p.proteins.length > 0
            ? `Sear the ${join(p.proteins)} in a single layer, undisturbed, for 2 minutes. Toss once, cook 1 more minute, then lift it out onto a plate.`
            : "Skip straight to the vegetables — this one is meat-free.",
          `Add the ${join(aromatics)} and stir for 30 seconds, just until fragrant. Don't let the garlic brown or it will turn bitter.`,
          `Add the ${join(veg, "vegetables")}, hardest first. Stir-fry 3–4 minutes so they stay bright and crunchy.`,
          `Return the ${p.proteins.length > 0 ? join(p.proteins) : "vegetables"} to the pan, pour in the soy sauce and sugar, and toss for a final minute until everything is glossy.`,
          p.starches.length > 0
            ? `Serve over the ${p.starches[0].toLowerCase()}.`
            : "Serve straight from the pan, on its own or in lettuce cups.",
        ],
        tips: baseTips(p),
      };
    },
  },
  {
    id: "traybake",
    score: (p) =>
      p.input.maxMinutes >= 40 && (p.proteins.length > 0 || p.vegetables.length > 1)
        ? 9 + p.proteins.length
        : 0,
    build: (p) => {
      const hero = p.proteins[0] ?? p.vegetables[0] ?? "Vegetable";
      const veg = [...p.vegetables, ...p.starches.filter((s) => s.toLowerCase().includes("potato"))];
      return {
        title: `One-Tray Roast ${titleCase(hero)}`,
        summary: `Everything goes on one tray and the oven does the work. Roughly ${Math.min(p.input.maxMinutes, 50)} minutes, most of it hands-off.`,
        totalMinutes: Math.min(p.input.maxMinutes, 50),
        tags: ["traybake", "hands-off", "one-pan"],
        ingredients: [
          ...p.proteins.map((item) => `${grams(400, p.input.servings)} ${item.toLowerCase()}`),
          ...veg.map((item) => `${grams(250, p.input.servings)} ${item.toLowerCase()}, cut into large chunks`),
          ...(p.aromatics.length > 0
            ? p.aromatics.map((item) => `1 ${item.toLowerCase()}, halved or smashed`)
            : ["1 onion, cut into wedges", "4 cloves garlic, skin on"]),
          "3 tbsp olive oil",
          "1 tsp dried oregano or paprika",
          ...(p.dairy.length > 0 ? [`${grams(80, p.input.servings)} ${p.dairy[0].toLowerCase()}, crumbled over at the end`] : []),
          ...SEASONING.slice(0, 2),
        ],
        steps: [
          "Heat the oven to 200°C / 400°F fan.",
          `Cut the ${join(veg, "vegetables")} into chunks of roughly equal size — uneven pieces mean some burn while others stay raw.`,
          `Tip everything onto your largest roasting tray with the oil, oregano, salt and pepper. Toss with your hands until every piece is coated, then spread it into one layer. Crowding steams instead of roasts; use two trays if you have to.`,
          p.proteins.length > 0
            ? `Nestle the ${join(p.proteins)} in among the vegetables and roast for 35–40 minutes, turning once at the halfway mark.`
            : "Roast for 30–35 minutes, turning once, until the edges are deeply browned.",
          p.dairy.length > 0
            ? `Crumble the ${p.dairy[0].toLowerCase()} over and return to the oven for 5 minutes.`
            : "Give it a final 5 minutes if you want more colour on the edges.",
          `Rest for 5 minutes before serving${p.herbs.length > 0 ? `, then scatter with ${join(p.herbs)}` : ""}.`,
        ],
        tips: baseTips(p),
      };
    },
  },
  {
    id: "pasta",
    score: (p) =>
      has(p, "pasta", "spaghetti", "penne", "noodle", "gnocchi") && !p.lowCarb ? 12 : 0,
    build: (p) => {
      const pastaItem =
        p.starches.find((item) =>
          ["pasta", "spaghetti", "penne", "noodle", "gnocchi"].some((k) =>
            item.toLowerCase().includes(k),
          ),
        ) ?? "pasta";
      const sauceBits = [...p.vegetables, ...p.proteins];
      return {
        title: `${titleCase(pastaItem)} with ${titleCase(sauceBits[0] ?? "Garlic and Oil")}`,
        summary: `A fridge-clearing pasta built around ${join(sauceBits.slice(0, 3), "garlic, oil and chilli")}. On the table in about 25 minutes.`,
        totalMinutes: Math.min(p.input.maxMinutes, 25),
        tags: ["pasta", "quick", "weeknight"],
        ingredients: [
          `${grams(180, p.input.servings)} ${pastaItem.toLowerCase()}`,
          ...p.proteins.map((item) => `${grams(250, p.input.servings)} ${item.toLowerCase()}, chopped`),
          ...p.vegetables.map((item) => `${grams(200, p.input.servings)} ${item.toLowerCase()}, sliced`),
          ...(p.aromatics.length > 0
            ? p.aromatics.map((item) => `${item.toLowerCase()}, finely sliced`)
            : ["3 cloves garlic, finely sliced"]),
          ...(p.dairy.length > 0 ? [`${grams(60, p.input.servings)} ${p.dairy[0].toLowerCase()}, grated`] : []),
          "4 tbsp olive oil",
          ...SEASONING.slice(0, 2),
        ],
        steps: [
          `Put a large pan of water on to boil and salt it properly — it should taste like the sea. This is the only chance you get to season the ${pastaItem.toLowerCase()} itself.`,
          `While it heats, slice the ${join([...p.aromatics, ...p.vegetables], "garlic")}.`,
          `Cook the ${pastaItem.toLowerCase()} one minute short of the packet time. Before you drain it, scoop out a mugful of the cooking water and keep it.`,
          `Meanwhile, warm the olive oil in a wide pan over medium heat and cook the ${join(p.aromatics, "garlic")} gently for 2 minutes — soft and golden, never brown.`,
          p.proteins.length > 0
            ? `Add the ${join(p.proteins)} and cook through, 4–5 minutes.`
            : "Keep the heat low so the oil takes on the flavour without frying.",
          p.vegetables.length > 0
            ? `Add the ${join(p.vegetables)} and cook 3–4 minutes until just tender.`
            : "",
          `Tip the drained ${pastaItem.toLowerCase()} into the pan with a good splash of the reserved water. Toss hard over the heat for a minute — the starch in that water is what turns oil into sauce.`,
          p.dairy.length > 0
            ? `Off the heat, stir through the ${p.dairy[0].toLowerCase()} and serve at once.`
            : "Serve at once, while it is still glossy.",
        ].filter(Boolean),
        tips: baseTips(p),
      };
    },
  },
  {
    id: "fried-rice",
    score: (p) => (has(p, "rice") && !p.lowCarb ? 11 : 0),
    build: (p) => {
      const veg = p.vegetables.length > 0 ? p.vegetables : ["frozen peas"];
      return {
        title: `${titleCase(p.proteins[0] ?? veg[0])} Fried Rice`,
        summary: `The classic answer to leftover rice and an odd assortment of vegetables. About 15 minutes.`,
        totalMinutes: Math.min(p.input.maxMinutes, 20),
        tags: ["fried rice", "leftovers", "quick"],
        ingredients: [
          `${grams(300, p.input.servings)} cooked rice, cold (day-old is best)`,
          ...p.proteins.map((item) => `${grams(200, p.input.servings)} ${item.toLowerCase()}, diced`),
          ...(p.eggs.length > 0 ? [`${Math.max(2, p.input.servings)} eggs, beaten`] : []),
          ...veg.map((item) => `${grams(150, p.input.servings)} ${item.toLowerCase()}, diced small`),
          ...(p.aromatics.length > 0
            ? p.aromatics.map((item) => `${item.toLowerCase()}, minced`)
            : ["3 cloves garlic, minced", "1 thumb ginger, minced"]),
          p.glutenFree ? "2 tbsp tamari" : "2 tbsp soy sauce",
          "1 tbsp neutral oil",
          "1 tsp sesame oil, to finish",
        ],
        steps: [
          "Break the cold rice up with your fingers so there are no clumps. Warm rice turns to porridge in the pan — if yours is fresh, spread it on a tray and chill it for 20 minutes first.",
          "Heat the oil in your widest pan over high heat.",
          ...(p.eggs.length > 0
            ? [
                "Pour in the beaten egg, let it set for 20 seconds, then scramble it roughly and tip it back onto a plate.",
              ]
            : []),
          p.proteins.length > 0
            ? `Fry the ${join(p.proteins)} until browned, about 3 minutes, then push it to one side of the pan.`
            : "",
          `Add the ${join(p.aromatics, "garlic and ginger")} and the ${join(veg)}. Stir-fry 2 minutes.`,
          "Add the rice and press it against the hot pan. Leave it alone for a full minute so the bottom crisps, then toss. Repeat twice.",
          `Splash in the soy sauce around the edge of the pan${p.eggs.length > 0 ? ", return the egg" : ""}, toss once more and finish with the sesame oil off the heat.`,
        ].filter(Boolean),
        tips: baseTips(p),
      };
    },
  },
  {
    id: "frittata",
    score: (p) =>
      p.eggs.length > 0 ? (p.input.meal === "breakfast" ? 14 : 10) : 0,
    build: (p) => ({
      title: `${titleCase(p.vegetables[0] ?? p.dairy[0] ?? "Everything")} Frittata`,
      summary: `Eggs plus whatever else is in there. Works hot for breakfast or cold from the fridge at midnight.`,
      totalMinutes: Math.min(p.input.maxMinutes, 30),
      tags: ["eggs", "frittata", "make-ahead"],
      ingredients: [
        `${Math.max(4, p.input.servings * 2)} eggs`,
        ...p.vegetables.map((item) => `${grams(150, p.input.servings)} ${item.toLowerCase()}, sliced`),
        ...p.proteins.map((item) => `${grams(150, p.input.servings)} ${item.toLowerCase()}, chopped`),
        ...(p.dairy.length > 0
          ? [`${grams(70, p.input.servings)} ${p.dairy[0].toLowerCase()}`]
          : []),
        ...(p.aromatics.length > 0
          ? p.aromatics.map((item) => `1 ${item.toLowerCase()}, sliced`)
          : ["1 onion, thinly sliced"]),
        "2 tbsp olive oil",
        ...SEASONING.slice(0, 2),
      ],
      steps: [
        "Heat the oven to 180°C / 350°F fan, or heat your grill if the pan is shallow.",
        `In an oven-safe frying pan, soften the ${join(p.aromatics, "onion")} in the oil over medium-low heat for 6–8 minutes until sweet and translucent.`,
        p.proteins.length > 0
          ? `Add the ${join(p.proteins)} and cook through.`
          : "",
        p.vegetables.length > 0
          ? `Add the ${join(p.vegetables)} and cook until any water they release has evaporated — a wet filling makes a soggy frittata.`
          : "",
        `Beat the eggs with a good pinch of salt and plenty of pepper${p.dairy.length > 0 ? `, then stir in half the ${p.dairy[0].toLowerCase()}` : ""}.`,
        "Pour the eggs over the filling, shake the pan to settle everything, and cook undisturbed on the hob for 3 minutes until the edges set.",
        `Transfer to the oven for 10–12 minutes${p.dairy.length > 0 ? `, scattering the rest of the ${p.dairy[0].toLowerCase()} on top` : ""}. It's done when the centre is just set but still has a slight wobble — it carries on cooking out of the oven.`,
        "Let it sit 5 minutes, then slide it out and cut into wedges.",
      ].filter(Boolean),
      tips: baseTips(p),
    }),
  },
  {
    id: "soup",
    score: (p) =>
      p.vegetables.length >= 2 && p.input.maxMinutes >= 30 && p.input.meal !== "dessert"
        ? 7 + p.vegetables.length
        : 0,
    build: (p) => ({
      title: `${titleCase(p.vegetables[0] ?? "Fridge-Bottom")} Soup`,
      summary: `A forgiving pot of soup that takes ${join(p.vegetables.slice(0, 3))} and turns it into dinner plus tomorrow's lunch.`,
      totalMinutes: Math.min(p.input.maxMinutes, 45),
      tags: ["soup", "batch-cook", "freezer-friendly"],
      ingredients: [
        ...p.vegetables.map((item) => `${grams(250, p.input.servings)} ${item.toLowerCase()}, roughly chopped`),
        ...p.proteins.map((item) => `${grams(200, p.input.servings)} ${item.toLowerCase()}`),
        ...(p.aromatics.length > 0
          ? p.aromatics.map((item) => `1 ${item.toLowerCase()}, chopped`)
          : ["1 onion, chopped", "3 cloves garlic, chopped"]),
        `${p.input.servings * 400} ml vegetable or chicken stock`,
        "2 tbsp olive oil",
        ...(p.dairy.length > 0 ? [`a spoonful of ${p.dairy[0].toLowerCase()}, to serve`] : []),
        ...SEASONING.slice(0, 2),
      ],
      steps: [
        `Warm the oil in a large pot and sweat the ${join(p.aromatics, "onion and garlic")} over low heat for 8 minutes. Take your time here — this is where the soup gets its backbone.`,
        `Add the ${join(p.vegetables)}, season with salt, and stir to coat in the oil. Cook 5 minutes.`,
        p.proteins.length > 0 ? `Stir in the ${join(p.proteins)}.` : "",
        "Pour in the stock, bring to a simmer, and cook 20–25 minutes until everything is completely tender.",
        "Blend until smooth if you want it silky, or leave it chunky. If you blend, do it in batches and never fill the jug more than halfway with hot liquid.",
        `Taste and adjust — it will almost certainly want more salt than you expect. Serve${p.dairy.length > 0 ? ` with a spoonful of ${p.dairy[0].toLowerCase()}` : ""}${p.herbs.length > 0 ? ` and a scatter of ${join(p.herbs)}` : ""}.`,
      ].filter(Boolean),
      tips: [
        ...baseTips(p),
        "Cools and freezes well for up to three months. Freeze it in portions, not one big block.",
      ],
    }),
  },
  {
    id: "crumble",
    score: (p) => (p.input.meal === "dessert" && p.fruits.length > 0 ? 15 : 0),
    build: (p) => ({
      title: `${titleCase(p.fruits[0])} Crumble`,
      summary: `Fruit under a rubbly, buttery lid. The most forgiving dessert there is.`,
      totalMinutes: Math.min(Math.max(p.input.maxMinutes, 45), 60),
      tags: ["dessert", "baking", "crumble"],
      ingredients: [
        ...p.fruits.map((item) => `${grams(400, p.input.servings)} ${item.toLowerCase()}, chopped`),
        "3 tbsp sugar, for the fruit",
        p.glutenFree ? "150 g gluten-free oats" : "150 g plain flour",
        "100 g oats",
        p.dairyFree ? "100 g cold coconut oil or vegan block" : "100 g cold butter, cubed",
        "80 g brown sugar",
        "a pinch of salt",
      ],
      steps: [
        "Heat the oven to 180°C / 350°F fan.",
        `Toss the ${join(p.fruits)} with the sugar and tip into a baking dish.`,
        "Rub the flour, oats, brown sugar, salt and cold fat together with your fingertips until it looks like coarse breadcrumbs with some larger lumps. The lumps are the good bit — don't overwork it.",
        "Scatter the crumble over the fruit without pressing it down. Air in the topping is what makes it crisp.",
        "Bake for 35–40 minutes until the top is golden and the fruit is bubbling up at the edges.",
        "Let it stand 10 minutes before serving — molten fruit is a genuine hazard.",
      ],
      tips: baseTips(p),
    }),
  },
  {
    id: "bowl",
    score: (p) => (p.input.maxMinutes <= 20 ? 6 : 3),
    build: (p) => {
      const all = [
        ...p.proteins,
        ...p.vegetables,
        ...p.starches,
        ...p.dairy,
        ...p.others,
      ];
      return {
        title: `${titleCase(all[0] ?? "Fridge")} Bowl`,
        summary: `No cooking required beyond a grain and a dressing. Assembly, really — ready in ${Math.min(p.input.maxMinutes, 15)} minutes.`,
        totalMinutes: Math.min(p.input.maxMinutes, 15),
        tags: ["no-cook", "quick", "bowl"],
        ingredients: [
          ...(p.starches.length > 0
            ? [`${grams(150, p.input.servings)} ${p.starches[0].toLowerCase()}, cooked and cooled`]
            : []),
          ...p.proteins.map((item) => `${grams(200, p.input.servings)} ${item.toLowerCase()}`),
          ...p.vegetables.map((item) => `${grams(150, p.input.servings)} ${item.toLowerCase()}, sliced or shredded`),
          ...(p.dairy.length > 0 ? [`${grams(60, p.input.servings)} ${p.dairy[0].toLowerCase()}`] : []),
          "3 tbsp olive oil",
          "1 tbsp lemon juice or vinegar",
          "1 tsp mustard or honey",
          ...SEASONING.slice(0, 2),
        ],
        steps: [
          "Shake the oil, lemon juice, mustard, salt and pepper together in a jar until it thickens. This is the whole dish — make it taste sharper than you think you want, because the other ingredients will mute it.",
          `Slice the ${join(p.vegetables, "vegetables")} as thinly as you can be bothered to. Thin slices carry dressing; thick chunks don't.`,
          p.proteins.length > 0
            ? `Add the ${join(p.proteins)}${p.proteins.some(isAnimalProtein) ? " — leftover roast or tinned works perfectly here" : ""}.`
            : "",
          p.starches.length > 0
            ? `Build the bowl on a base of ${p.starches[0].toLowerCase()}.`
            : "Pile everything into a wide, shallow bowl.",
          `Dress it just before eating, toss well${p.dairy.length > 0 ? `, and crumble the ${p.dairy[0].toLowerCase()} over the top` : ""}.`,
        ].filter(Boolean),
        tips: baseTips(p),
      };
    },
  },
  {
    id: "skillet",
    // The always-available fallback: works with literally any input.
    score: () => 4,
    build: (p) => {
      const all = [...p.proteins, ...p.vegetables, ...p.others];
      return {
        title: `${titleCase(all[0] ?? "Anything")} Skillet Supper`,
        summary: `One pan, whatever you've got, no recipe police. Built around ${join(all.slice(0, 3), "storecupboard basics")}.`,
        totalMinutes: Math.min(p.input.maxMinutes, 30),
        tags: ["one-pan", "improvised", "weeknight"],
        ingredients: [
          ...all.map((item) => `${grams(200, p.input.servings)} ${item.toLowerCase()}, chopped`),
          ...(p.starches.length > 0
            ? [`${grams(150, p.input.servings)} ${p.starches[0].toLowerCase()}`]
            : []),
          ...(p.aromatics.length > 0
            ? p.aromatics.map((item) => `1 ${item.toLowerCase()}, chopped`)
            : ["1 onion, chopped", "3 cloves garlic, chopped"]),
          "1 tin (400 g) chopped tomatoes or 250 ml stock",
          "2 tbsp olive oil",
          "1 tsp smoked paprika or cumin",
          ...SEASONING.slice(0, 2),
        ],
        steps: [
          `Heat the oil in a deep frying pan and cook the ${join(p.aromatics, "onion and garlic")} over medium heat until soft, 6–8 minutes.`,
          "Stir in the paprika and let it toast for 30 seconds — dry spices need fat and heat to give anything up.",
          p.proteins.length > 0
            ? `Add the ${join(p.proteins)} and brown it well on all sides.`
            : "",
          `Add the ${join(p.vegetables, "remaining vegetables")} and stir to coat.`,
          "Pour in the tomatoes or stock, season, and simmer 15 minutes until thickened and the vegetables are tender.",
          p.starches.length > 0
            ? `Serve over the ${p.starches[0].toLowerCase()}.`
            : "Serve with bread to mop the pan.",
        ].filter(Boolean),
        tips: baseTips(p),
      };
    },
  },
];

export async function generateRecipeWithMock(
  input: GenerateInput,
): Promise<RecipeDraft> {
  const pantry = buildPantry(input);

  const scored = TEMPLATES.map((template) => ({
    template,
    score: template.score(pantry),
  })).filter((entry) => entry.score > 0);

  // "Try another" asks us to avoid what it just showed. Honour that only while
  // something is left to cook — a fridge with one good answer still gets it.
  const avoid = new Set(input.avoid ?? []);
  const eligible = scored.filter((entry) => !avoid.has(entry.template.id));
  const candidates = eligible.length > 0 ? eligible : scored;

  // Choose randomly among the joint winners, so repeat presses vary even when
  // the same handful of templates keep tying.
  const best = Math.max(...candidates.map((entry) => entry.score));
  const winners = candidates.filter((entry) => entry.score >= best - 1);
  const chosen = pick(winners).template;

  const draft = chosen.build(pantry);

  // A short, honest pause so the loading state is visible and the swap to a
  // real model later doesn't change how the UI feels.
  await new Promise((resolve) => setTimeout(resolve, 400));

  return {
    ...draft,
    kind: chosen.id,
    servings: input.servings,
    tags: [...new Set([...draft.tags, input.meal, ...input.diets])],
    sourceIngredients: input.ingredients,
    generatedBy: "mock",
  };
}
