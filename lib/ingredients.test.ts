import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatIngredient,
  formatQuantity,
  missingFrom,
  normaliseItem,
  pantryCovers,
  parseIngredientLine,
  roundQuantity,
} from "./ingredients.ts";

describe("parseIngredientLine", () => {
  it("splits amount, unit, item and preparation", () => {
    assert.deepEqual(parseIngredientLine("400 g chicken breast, sliced thin"), {
      quantity: 400,
      unit: "g",
      item: "chicken breast",
      note: "sliced thin",
    });
  });

  it("treats a countable thing as having no unit", () => {
    assert.deepEqual(parseIngredientLine("3 eggs"), {
      quantity: 3,
      unit: "",
      item: "eggs",
      note: "",
    });
  });

  it("handles a unit glued to the number", () => {
    const parsed = parseIngredientLine("400g flour");
    assert.equal(parsed.quantity, 400);
    assert.equal(parsed.unit, "g");
    assert.equal(parsed.item, "flour");
  });

  it("reads decimals, simple fractions and mixed numbers", () => {
    assert.equal(parseIngredientLine("1.5 tbsp oil").quantity, 1.5);
    assert.equal(parseIngredientLine("1/2 cup rice").quantity, 0.5);
    assert.equal(parseIngredientLine("1 1/2 cups milk").quantity, 1.5);
    assert.equal(parseIngredientLine("½ lemon").quantity, 0.5);
    assert.equal(parseIngredientLine("1 ½ tsp salt").quantity, 1.5);
  });

  it("keeps lines with no number intact", () => {
    assert.deepEqual(parseIngredientLine("a pinch of salt"), {
      quantity: null,
      unit: "",
      item: "a pinch of salt",
      note: "",
    });
  });

  it("never loses text it cannot interpret", () => {
    const weird = "roughly two thirds of whatever is left, chopped";
    const parsed = parseIngredientLine(weird);
    assert.equal(formatIngredient(parsed), weird);
  });

  it("survives an empty line", () => {
    assert.deepEqual(parseIngredientLine("   "), {
      quantity: null,
      unit: "",
      item: "",
      note: "",
    });
  });
});

describe("round trip", () => {
  const LINES = [
    "400 g chicken breast, sliced thin",
    "3 eggs",
    "2 tbsp olive oil",
    "1 onion, finely chopped",
    "a pinch of salt",
    "250 ml vegetable stock",
    "4 cloves garlic, smashed",
  ];

  it("formats back to what was written", () => {
    for (const line of LINES) {
      assert.equal(formatIngredient(parseIngredientLine(line)), line, line);
    }
  });
});

describe("scaling", () => {
  it("doubles an amount", () => {
    const parsed = parseIngredientLine("200 g rice");
    assert.equal(formatIngredient(parsed, 2), "400 g rice");
  });

  it("halves into a readable fraction rather than a decimal", () => {
    const parsed = parseIngredientLine("1 tbsp honey");
    assert.equal(formatIngredient(parsed, 0.5), "½ tbsp honey");
  });

  it("never produces a machine-looking number", () => {
    // 400 / 3 = 133.333…
    const parsed = parseIngredientLine("400 g flour");
    const scaled = formatIngredient(parsed, 1 / 3);
    assert.ok(!scaled.includes("."), scaled);
    assert.equal(scaled, "130 g flour");
  });

  it("leaves unnumbered ingredients alone", () => {
    const parsed = parseIngredientLine("a pinch of salt");
    assert.equal(formatIngredient(parsed, 4), "a pinch of salt");
  });

  it("does not scale the preparation note", () => {
    const parsed = parseIngredientLine("2 onions, finely chopped");
    assert.equal(formatIngredient(parsed, 3), "6 onions, finely chopped");
  });
});

describe("roundQuantity", () => {
  it("gets coarser as amounts get bigger", () => {
    assert.equal(roundQuantity(133.33), 130);
    assert.equal(roundQuantity(23.4), 25);
    assert.equal(roundQuantity(12.4), 12);
    assert.equal(roundQuantity(1.6), 1.5);
    assert.equal(roundQuantity(0.33), 0.375);
  });
});

describe("formatQuantity", () => {
  it("prefers fraction glyphs", () => {
    assert.equal(formatQuantity(0.5), "½");
    assert.equal(formatQuantity(0.25), "¼");
    assert.equal(formatQuantity(1.5), "1½");
    assert.equal(formatQuantity(2), "2");
  });
});

describe("pantry matching", () => {
  it("matches a broader fridge item to a specific recipe item", () => {
    assert.ok(pantryCovers(["chicken"], parseIngredientLine("400 g chicken breast")));
  });

  it("matches a specific fridge item to a broader recipe item", () => {
    assert.ok(pantryCovers(["chicken thighs"], parseIngredientLine("400 g chicken")));
  });

  it("ignores plurals", () => {
    assert.ok(pantryCovers(["egg"], parseIngredientLine("3 eggs")));
    assert.ok(pantryCovers(["tomatoes"], parseIngredientLine("2 tomato")));
  });

  it("does not match unrelated food", () => {
    assert.equal(pantryCovers(["chicken"], parseIngredientLine("200 g beef")), false);
  });

  it("treats an unnamed ingredient as covered", () => {
    assert.ok(pantryCovers([], parseIngredientLine("   ")));
  });

  it("builds a shopping list of only what is missing", () => {
    const recipe = [
      "400 g chicken breast, sliced",
      "2 tbsp soy sauce",
      "3 cloves garlic",
      "200 g broccoli",
    ].map(parseIngredientLine);

    const missing = missingFrom(["chicken", "garlic"], recipe);
    assert.deepEqual(
      missing.map((i) => i.item),
      ["soy sauce", "broccoli"],
    );
  });
});

describe("normaliseItem", () => {
  it("strips parentheticals and punctuation", () => {
    assert.equal(normaliseItem("tomatoes (tinned)"), "tomato");
  });

  it("leaves words that merely end in s-like endings", () => {
    assert.equal(normaliseItem("asparagus"), "asparagus");
    assert.equal(normaliseItem("couscous"), "couscous");
  });
});
