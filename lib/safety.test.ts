import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parseIngredientLine } from "./ingredients.ts";
import { checkSafety } from "./safety.ts";

type Parts = {
  title?: string;
  summary?: string;
  steps?: string[];
  tips?: string[];
  ingredients?: string[];
};

function recipe(parts: Parts) {
  return {
    title: parts.title ?? "Test dish",
    summary: parts.summary ?? "",
    steps: parts.steps ?? [],
    tips: parts.tips ?? [],
    ingredients: (parts.ingredients ?? []).map(parseIngredientLine),
  };
}

function ids(parts: Parts): string[] {
  return checkSafety(recipe(parts)).map((note) => note.id);
}

describe("garlic in oil", () => {
  it("catches the documented botulism case", () => {
    // This is close to the Gemini recipe that nearly harmed a real person.
    const notes = ids({
      ingredients: ["4 cloves garlic", "200 ml olive oil"],
      steps: ["Submerge the garlic in the oil and store in a jar on the counter."],
    });
    assert.ok(notes.includes("garlic-in-oil"), notes.join(","));
  });

  it("stays quiet when the recipe says to refrigerate it", () => {
    const notes = ids({
      ingredients: ["4 cloves garlic", "200 ml olive oil"],
      steps: ["Steep the garlic in the oil, then refrigerate and use within four days."],
    });
    assert.equal(notes.includes("garlic-in-oil"), false);
  });

  it("does not fire on ordinary frying", () => {
    const notes = ids({
      ingredients: ["2 cloves garlic", "1 tbsp olive oil"],
      steps: ["Warm the oil and cook the garlic for 30 seconds until fragrant."],
    });
    assert.equal(notes.includes("garlic-in-oil"), false);
  });
});

describe("kidney beans", () => {
  it("flags dried beans", () => {
    assert.ok(
      ids({ ingredients: ["200 g dried kidney beans"] }).includes("kidney-beans"),
    );
  });

  it("does not flag tinned beans", () => {
    assert.equal(
      ids({ ingredients: ["1 tin kidney beans, drained"] }).includes("kidney-beans"),
      false,
    );
  });
});

describe("doneness", () => {
  it("reminds you to check poultry", () => {
    assert.ok(
      ids({ ingredients: ["400 g chicken breast"], steps: ["Fry for 5 minutes."] })
        .includes("poultry-doneness"),
    );
  });

  it("stays quiet when a temperature is already given", () => {
    assert.equal(
      ids({
        ingredients: ["400 g chicken breast"],
        steps: ["Roast until the thickest part reaches 75°C."],
      }).includes("poultry-doneness"),
      false,
    );
  });

  it("flags mince separately from whole cuts", () => {
    assert.ok(ids({ ingredients: ["400 g beef mince"] }).includes("pork-mince-doneness"));
  });
});

describe("rice", () => {
  it("warns about day-old rice", () => {
    assert.ok(
      ids({
        ingredients: ["300 g cooked rice, cold"],
        steps: ["Day-old rice works best."],
      }).includes("rice-cooling"),
    );
  });
});

describe("ordering and shape", () => {
  it("puts danger before caution", () => {
    const notes = checkSafety(
      recipe({
        ingredients: ["200 g dried kidney beans", "300 g cooked rice, cold"],
        steps: ["Use day-old rice."],
      }),
    );
    assert.ok(notes.length >= 2);
    assert.equal(notes[0].severity, "danger");
  });

  it("returns nothing for a plainly safe recipe", () => {
    assert.deepEqual(
      ids({
        title: "Tomato salad",
        ingredients: ["3 tomatoes, sliced", "1 tbsp olive oil"],
        steps: ["Slice the tomatoes. Dress with the oil. Eat."],
      }),
      [],
    );
  });

  it("gives every note an id, a title and a detail", () => {
    for (const note of checkSafety(recipe({ ingredients: ["200 g dried kidney beans"] }))) {
      assert.ok(note.id.length > 0);
      assert.ok(note.title.length > 0);
      assert.ok(note.detail.length > 20, "details should be actionable, not a label");
    }
  });
});
