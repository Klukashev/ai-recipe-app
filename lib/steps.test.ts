import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { findMinutes, formatClock } from "./steps.ts";

describe("findMinutes", () => {
  it("takes the longer end of a range", () => {
    assert.equal(findMinutes("Stir-fry 3–4 minutes so they stay bright."), 4);
    assert.equal(findMinutes("Roast for 35-40 minutes, turning once."), 40);
  });

  it("reads a single duration", () => {
    assert.equal(findMinutes("Cook for 20 minutes until tender."), 20);
    assert.equal(findMinutes("Simmer 15 min."), 15);
  });

  it("rounds seconds up to a usable minute", () => {
    assert.equal(findMinutes("Stir for 30 seconds, just until fragrant."), 1);
  });

  it("understands hours", () => {
    assert.equal(findMinutes("Leave to prove for 2 hours."), 120);
  });

  it("returns null when a step is not a wait", () => {
    assert.equal(findMinutes("Season with salt and pepper."), null);
    assert.equal(findMinutes("Heat the oven to 200°C / 400°F fan."), null);
  });

  it("does not mistake a temperature for a duration", () => {
    assert.equal(findMinutes("Cook until it reaches 75°C in the centre."), null);
  });
});

describe("formatClock", () => {
  it("pads seconds", () => {
    assert.equal(formatClock(65), "1:05");
    assert.equal(formatClock(600), "10:00");
    assert.equal(formatClock(9), "0:09");
  });

  it("never shows a negative clock", () => {
    assert.equal(formatClock(-5), "0:00");
  });
});
