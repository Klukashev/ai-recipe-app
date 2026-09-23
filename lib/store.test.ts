import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { migrate } from "./store.ts";

/**
 * Migration is the part of the store worth testing in isolation: it's pure, and
 * getting it wrong silently destroys recipes people saved before the shape
 * changed. The CRUD paths touch the real filesystem and are covered end to end
 * by the checks in the scratchpad harness instead.
 */

const LEGACY = {
  id: "abc",
  title: "Old recipe",
  summary: "Saved before ingredients were structured",
  servings: 2,
  totalMinutes: 30,
  tags: ["stir-fry"],
  ingredients: ["400 g chicken breast, sliced thin", "3 eggs", "a pinch of salt"],
  steps: ["Cook it."],
  tips: [],
  sourceIngredients: ["chicken", "eggs"],
  generatedBy: "mock",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("migrate", () => {
  it("parses legacy string ingredients into structure", () => {
    const migrated = migrate(LEGACY);
    assert.ok(migrated);
    assert.deepEqual(migrated.ingredients[0], {
      quantity: 400,
      unit: "g",
      item: "chicken breast",
      note: "sliced thin",
    });
    assert.deepEqual(migrated.ingredients[1], {
      quantity: 3,
      unit: "",
      item: "eggs",
      note: "",
    });
  });

  it("gives a pre-cook-log recipe an empty log rather than undefined", () => {
    const migrated = migrate(LEGACY);
    assert.deepEqual(migrated?.cookLog, []);
  });

  it("backfills a missing kind", () => {
    assert.equal(migrate(LEGACY)?.kind, "");
  });

  it("leaves an already-current record untouched", () => {
    const current = {
      ...LEGACY,
      kind: "stir-fry",
      ingredients: [{ quantity: 2, unit: "tbsp", item: "oil", note: "" }],
      cookLog: [{ at: "2026-02-01T00:00:00.000Z", rating: 5, note: "great" }],
    };
    const migrated = migrate(current);
    assert.deepEqual(migrated?.ingredients, current.ingredients);
    assert.deepEqual(migrated?.cookLog, current.cookLog);
    assert.equal(migrated?.kind, "stir-fry");
  });

  it("rejects junk instead of producing a broken recipe", () => {
    assert.equal(migrate(null), null);
    assert.equal(migrate("nope"), null);
    assert.equal(migrate({}), null);
    assert.equal(migrate({ title: "no id" }), null);
  });

  it("copes with a record whose ingredients field is missing", () => {
    const withoutIngredients = { ...LEGACY };
    delete (withoutIngredients as Partial<typeof LEGACY>).ingredients;
    assert.deepEqual(migrate(withoutIngredients)?.ingredients, []);
  });
});
