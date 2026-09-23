import type { Ingredient } from "./types";

/**
 * Turning ingredient text into structure and back again.
 *
 * Generators (and people typing in the edit box) produce lines like
 * "400 g chicken breast, sliced thin". Everything downstream — scaling for more
 * servings, diffing against the fridge for a shopping list — needs the amount,
 * the unit and the food kept apart. This module is the only place that knows
 * how to convert between the two.
 */

/** Units we recognise. Anything else after a number is treated as the food
 *  itself, so "3 eggs" parses as quantity 3, no unit, item "eggs". */
const UNITS = new Set([
  "g", "kg", "mg", "ml", "l", "cl",
  "oz", "lb", "lbs",
  "tsp", "tbsp", "tbs", "dsp",
  "cup", "cups",
  "clove", "cloves",
  "tin", "tins", "can", "cans", "jar", "jars", "packet", "packets",
  "slice", "slices", "sprig", "sprigs", "stick", "sticks",
  "pinch", "pinches", "handful", "handfuls", "bunch", "bunches",
  "piece", "pieces", "punnet", "punnets", "head", "heads",
]);

const UNICODE_FRACTIONS: Record<string, number> = {
  "½": 0.5, "⅓": 1 / 3, "⅔": 2 / 3, "¼": 0.25, "¾": 0.75,
  "⅕": 0.2, "⅖": 0.4, "⅗": 0.6, "⅘": 0.8, "⅙": 1 / 6, "⅚": 5 / 6,
  "⅛": 0.125, "⅜": 0.375, "⅝": 0.625, "⅞": 0.875,
};

/** Nicest fraction glyph for a remainder, if one is close enough. */
const FRACTION_GLYPHS: Array<[number, string]> = [
  [0.125, "⅛"], [0.25, "¼"], [1 / 3, "⅓"], [0.375, "⅜"], [0.5, "½"],
  [0.625, "⅝"], [2 / 3, "⅔"], [0.75, "¾"], [0.875, "⅞"],
];

/**
 * Read a leading amount off a line.
 * Handles "400", "1.5", "1/2", "1 1/2" and "½".
 * Returns null when the line doesn't start with a number at all.
 */
function readQuantity(tokens: string[]): { quantity: number; used: number } | null {
  const first = tokens[0];
  if (!first) return null;

  if (UNICODE_FRACTIONS[first] !== undefined) {
    return { quantity: UNICODE_FRACTIONS[first], used: 1 };
  }

  // "1 1/2" — a whole number followed by a fraction.
  if (/^\d+$/.test(first) && tokens[1] && /^\d+\/\d+$/.test(tokens[1])) {
    const [n, d] = tokens[1].split("/").map(Number);
    if (d !== 0) return { quantity: Number(first) + n / d, used: 2 };
  }
  if (/^\d+$/.test(first) && tokens[1] && UNICODE_FRACTIONS[tokens[1]] !== undefined) {
    return { quantity: Number(first) + UNICODE_FRACTIONS[tokens[1]], used: 2 };
  }

  if (/^\d+\/\d+$/.test(first)) {
    const [n, d] = first.split("/").map(Number);
    if (d !== 0) return { quantity: n / d, used: 1 };
  }

  // Plain integer or decimal, optionally glued to a unit ("400g").
  const glued = first.match(/^(\d+(?:\.\d+)?)([a-zA-Z]+)$/);
  if (glued && UNITS.has(glued[2].toLowerCase())) {
    // Re-inject the unit as its own token by reporting we consumed nothing of it.
    tokens[0] = glued[2];
    return { quantity: Number(glued[1]), used: 0 };
  }

  if (/^\d+(?:\.\d+)?$/.test(first)) {
    return { quantity: Number(first), used: 1 };
  }

  return null;
}

/**
 * Parse one written ingredient line into its parts.
 *
 * Never throws and never loses text: anything it can't interpret ends up in
 * `item`, so a weird line still displays exactly as it was written.
 */
export function parseIngredientLine(line: string): Ingredient {
  const trimmed = line.trim();
  if (!trimmed) return { quantity: null, unit: "", item: "", note: "" };

  // Everything after the first comma is preparation, not part of the food.
  const comma = trimmed.indexOf(",");
  const head = comma === -1 ? trimmed : trimmed.slice(0, comma);
  const note = comma === -1 ? "" : trimmed.slice(comma + 1).trim();

  const tokens = head.split(/\s+/);
  const read = readQuantity(tokens);

  if (!read) {
    return { quantity: null, unit: "", item: head.trim(), note };
  }

  const rest = tokens.slice(read.used);
  let unit = "";
  if (rest.length > 0 && UNITS.has(rest[0].toLowerCase().replace(/\.$/, ""))) {
    unit = rest.shift()!.replace(/\.$/, "");
  }

  return {
    quantity: read.quantity,
    unit,
    item: rest.join(" ").trim(),
    note,
  };
}

/**
 * Round a scaled amount to something a person would actually write.
 *
 * Straight multiplication gives "266.6666 g chicken", which is the tell-tale
 * sign of a machine. Bigger amounts tolerate coarser rounding; small ones get
 * snapped to quarters so they can be shown as fractions.
 */
export function roundQuantity(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value >= 100) return Math.round(value / 10) * 10;
  if (value >= 20) return Math.round(value / 5) * 5;
  if (value >= 10) return Math.round(value);
  if (value >= 1) return Math.round(value * 4) / 4;
  return Math.round(value * 8) / 8;
}

/** Render an amount using fraction glyphs where they read better than decimals. */
export function formatQuantity(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";

  const whole = Math.floor(value);
  const remainder = value - whole;

  if (remainder < 0.01) return String(whole);

  for (const [fraction, glyph] of FRACTION_GLYPHS) {
    if (Math.abs(remainder - fraction) < 0.02) {
      return whole === 0 ? glyph : `${whole}${glyph}`;
    }
  }

  // Nothing close to a nice fraction — show at most one decimal place.
  return String(Math.round(value * 10) / 10);
}

/**
 * Write an ingredient back out as a line, optionally scaled.
 *
 * `scale` of 1 round-trips the original text closely enough that the edit box
 * shows people what they wrote rather than a reformatted version of it.
 */
export function formatIngredient(ingredient: Ingredient, scale = 1): string {
  const parts: string[] = [];

  if (ingredient.quantity !== null) {
    const scaled = scale === 1
      ? ingredient.quantity
      : roundQuantity(ingredient.quantity * scale);
    const rendered = formatQuantity(scaled);
    if (rendered) parts.push(rendered);
  }

  if (ingredient.unit) parts.push(ingredient.unit);
  if (ingredient.item) parts.push(ingredient.item);

  const head = parts.join(" ");
  return ingredient.note ? `${head}, ${ingredient.note}` : head;
}

export function parseIngredientLines(text: string): Ingredient[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map(parseIngredientLine);
}

export function formatIngredientLines(ingredients: Ingredient[], scale = 1): string {
  return ingredients.map((item) => formatIngredient(item, scale)).join("\n");
}

/**
 * Crude English singulariser. Only ever used for matching, never for display,
 * so being approximately right is fine — but the endings below are the ones
 * that actually turn up in a kitchen ("tomatoes", "berries", "asparagus").
 */
function singular(word: string): string {
  if (/(ss|us|is)$/.test(word)) return word; // asparagus, couscous, watercress
  if (/ies$/.test(word)) return `${word.slice(0, -3)}y`; // berries → berry
  if (/oes$/.test(word)) return word.slice(0, -2); // tomatoes → tomato
  if (/(ch|sh|x|z)es$/.test(word)) return word.slice(0, -2); // bunches → bunch
  if (/s$/.test(word)) return word.slice(0, -1);
  return word;
}

/** Normalise an ingredient name for comparison: lowercase, singular-ish, no
 *  parenthetical asides. Used to match a recipe against what's in the fridge. */
export function normaliseItem(item: string): string {
  return item
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map(singular)
    .join(" ")
    .trim();
}

/**
 * Does the fridge cover this ingredient?
 *
 * Deliberately loose in both directions — "chicken" in the fridge should cover
 * "chicken breast" in a recipe, and vice versa. A shopping list that nags you
 * to buy something you already have is worse than one that occasionally misses.
 */
export function pantryCovers(pantry: string[], ingredient: Ingredient): boolean {
  const target = normaliseItem(ingredient.item);
  if (!target) return true;

  return pantry.some((raw) => {
    const have = normaliseItem(raw);
    if (!have) return false;
    return target.includes(have) || have.includes(target);
  });
}

/** Ingredients the fridge doesn't cover — i.e. the shopping list. */
export function missingFrom(pantry: string[], ingredients: Ingredient[]): Ingredient[] {
  return ingredients.filter((ingredient) => !pantryCovers(pantry, ingredient));
}
