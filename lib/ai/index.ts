import type { GenerateInput, RecipeDraft } from "../types";
import { generateRecipeWithMock } from "./mock.ts";

/**
 * The single swap point for recipe generation.
 *
 * Right now this runs a local, deterministic-ish generator so the app works on
 * localhost with no API key. To use a real model instead, replace the body of
 * this function with a call to your provider (see `./mock.ts` for the shape the
 * rest of the app expects) — nothing outside this file needs to change.
 *
 * Example, using the Anthropic SDK:
 *
 *   import Anthropic from "@anthropic-ai/sdk";
 *   const client = new Anthropic(); // reads ANTHROPIC_API_KEY
 *   const message = await client.messages.create({
 *     model: "claude-sonnet-5",
 *     max_tokens: 2000,
 *     tools: [{ name: "emit_recipe", input_schema: RECIPE_SCHEMA }],
 *     tool_choice: { type: "tool", name: "emit_recipe" },
 *     messages: [{ role: "user", content: buildPrompt(input) }],
 *   });
 *   return parseToolResult(message);
 */
export async function generateRecipe(
  input: GenerateInput,
): Promise<RecipeDraft> {
  return generateRecipeWithMock(input);
}
