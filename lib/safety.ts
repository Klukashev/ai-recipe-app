import type { RecipeDraft, SafetyNote } from "./types";

/**
 * Deterministic food-safety checks.
 *
 * This is rules, not a model, and that is the entire point. The documented
 * failures of AI-written recipes are not stylistic — a generated recipe told a
 * user to store raw garlic in oil at room temperature, which is a botulism
 * risk. A language model that produced that text cannot be trusted to catch it
 * on a second pass, because it has no idea it was wrong the first time.
 *
 * So: a small, boring, testable rule set that runs over finished recipe text
 * regardless of which generator produced it. It annotates rather than blocks —
 * most matches are legitimate cooking that simply deserves a note — but the
 * notes are specific enough to act on.
 *
 * Rules are intentionally conservative about false positives on the `danger`
 * level; `caution` is used where the technique is normal but the failure mode
 * is worth stating.
 */

type Rule = {
  id: string;
  severity: SafetyNote["severity"];
  title: string;
  detail: string;
  /** All of these must appear somewhere in the recipe text. */
  all?: RegExp[];
  /** At least one of these must appear. */
  any?: RegExp[];
  /** If any of these appear, the rule is suppressed — the recipe already says it. */
  unless?: RegExp[];
};

const RULES: Rule[] = [
  {
    id: "garlic-in-oil",
    severity: "danger",
    title: "Don't store garlic or herbs in oil at room temperature",
    detail:
      "Garlic, herbs and chillies held in oil without acid are a botulism risk — this is the failure that has actually harmed people following AI-written recipes. Make it fresh and use it the same day, or keep it refrigerated for no more than four days.",
    all: [/\b(garlic|herb|chilli|chili|basil|rosemary)\b/, /\boil\b/],
    any: [/\b(infus|steep|store|keep|jar|preserve|submerg|cover.{0,12}oil)/],
    unless: [/\brefrigerat|\bfridge\b|\bsame day\b/],
  },
  {
    id: "rice-cooling",
    severity: "caution",
    title: "Cool cooked rice quickly, reheat once",
    detail:
      "Rice left at room temperature can grow Bacillus cereus, which survives reheating. Cool it within an hour, refrigerate, and reheat only once until steaming hot.",
    all: [/\brice\b/],
    any: [/\bcold\b|\bleftover\b|\bday-old\b|\bcool\b|\breheat/],
  },
  {
    id: "poultry-doneness",
    severity: "caution",
    title: "Cook poultry right through",
    detail:
      "Chicken and turkey need 75°C / 165°F in the thickest part, with juices running clear. Timings vary with thickness far more than recipes admit — check the centre, don't trust the clock.",
    any: [/\bchicken\b|\bturkey\b|\bpoultry\b|\bduck breast\b/],
    unless: [/75\s*°?c|165\s*°?f|\bthermometer\b/],
  },
  {
    id: "pork-mince-doneness",
    severity: "caution",
    title: "Mince and pork need to be cooked through",
    detail:
      "Unlike a whole cut, minced meat carries surface bacteria all the way through, so it can't be served pink. Cook to 71°C / 160°F.",
    any: [/\bmince\b|\bground (beef|pork|lamb|turkey)\b|\bpork\b|\bsausage\b/],
    unless: [/71\s*°?c|160\s*°?f|\bthermometer\b/],
  },
  {
    id: "kidney-beans",
    severity: "danger",
    title: "Dried kidney beans must be boiled hard for 10 minutes",
    detail:
      "Raw and under-cooked kidney beans contain phytohaemagglutinin, which causes violent illness — a slow cooker alone does not get hot enough. Soak, then boil vigorously for at least 10 minutes before simmering. Tinned beans are already safe.",
    all: [/\bkidney bean/],
    unless: [/\btin|\bcan(ned)?\b|\bboil.{0,30}10\b/],
  },
  {
    id: "raw-egg",
    severity: "caution",
    title: "Raw or barely-set egg isn't for everyone",
    detail:
      "Uncooked egg should be pasteurised if it's being served to anyone pregnant, very young, elderly or immunocompromised.",
    any: [/\braw egg|\buncooked egg|\begg (yolk|white)s? (into|to)\b/],
    unless: [/\bpasteuris|\bpasteuriz/],
  },
  {
    id: "reheat-once",
    severity: "caution",
    title: "Reheat leftovers only once",
    detail:
      "Cool leftovers quickly, refrigerate within two hours, eat within three days, and reheat until piping hot all the way through — once only.",
    any: [/\bleftover|\bkeeps? (for|up to)\b|\bfreezes? well\b|\bbatch/],
  },
  {
    id: "canning",
    severity: "danger",
    title: "Home preserving needs a tested process",
    detail:
      "Bottling and canning low-acid food safely depends on measured acidity and pressure processing — follow a tested, published process from a food-safety authority rather than a generated one.",
    any: [/\bcanning\b|\bwater bath\b|\bsterilis(e|ed|ing) jar|\bsteriliz(e|ed|ing) jar|\bpreserve in jars\b/],
  },
  {
    id: "sprouts-raw-flour",
    severity: "caution",
    title: "Raw flour and raw sprouts carry risk",
    detail:
      "Raw flour has been linked to E. coli and raw sprouted seeds to salmonella. Heat-treat flour for no-bake doses and cook sprouts if you're serving anyone vulnerable.",
    any: [/\braw flour\b|\bcookie dough\b|\bbean sprout|\balfalfa\b/],
    unless: [/\bheat-treat|\btoast the flour\b/],
  },
];

/** Everything a rule can match against, lowercased once. */
function haystack(recipe: Pick<RecipeDraft, "title" | "summary" | "steps" | "tips" | "ingredients">): string {
  return [
    recipe.title,
    recipe.summary,
    ...recipe.steps,
    ...recipe.tips,
    // The unit matters as much as the item: "1 tin kidney beans" is safe where
    // "200 g dried kidney beans" is not, and the difference lives in the unit.
    ...recipe.ingredients.map((i) => `${i.quantity ?? ""} ${i.unit} ${i.item} ${i.note}`),
  ]
    .join(" \n ")
    .toLowerCase();
}

/**
 * Run every rule over a recipe. Pure and synchronous, so it can be called
 * straight from a server component or a hook-free view component — the notes
 * are always current with the rule set rather than frozen at save time.
 */
export function checkSafety(
  recipe: Pick<RecipeDraft, "title" | "summary" | "steps" | "tips" | "ingredients">,
): SafetyNote[] {
  const text = haystack(recipe);

  const notes = RULES.filter((rule) => {
    if (rule.all && !rule.all.every((pattern) => pattern.test(text))) return false;
    if (rule.any && !rule.any.some((pattern) => pattern.test(text))) return false;
    if (rule.unless?.some((pattern) => pattern.test(text))) return false;
    return true;
  }).map(({ id, severity, title, detail }) => ({ id, severity, title, detail }));

  // Danger first — if a recipe trips both, the botulism note outranks the
  // reminder about reheating leftovers.
  return notes.sort((a, b) =>
    a.severity === b.severity ? 0 : a.severity === "danger" ? -1 : 1,
  );
}

/** Rule ids, for tests and for anywhere that needs to reference one by name. */
export const SAFETY_RULE_IDS = RULES.map((rule) => rule.id);
