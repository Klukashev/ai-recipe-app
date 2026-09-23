# Fridge Chef

Tell it what's in your fridge, get a recipe built around it, then save and edit
the ones worth keeping. Built with Next.js 16 (App Router) and Tailwind v4.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000. No API keys, no database, no other setup.

## How it fits together

| Path | What it does |
| --- | --- |
| [app/page.tsx](app/page.tsx) | The generator screen |
| [app/recipes/page.tsx](app/recipes/page.tsx) | Saved recipes |
| [app/recipes/[id]/page.tsx](app/recipes/%5Bid%5D/page.tsx) | One recipe — view, scale, edit, log, delete |
| [app/recipes/[id]/cook/page.tsx](app/recipes/%5Bid%5D/cook/page.tsx) | Cook mode |
| [app/actions.ts](app/actions.ts) | Server actions: generate, save, update, delete |
| [lib/ai/index.ts](lib/ai/index.ts) | **The generation swap point** |
| [lib/ai/mock.ts](lib/ai/mock.ts) | The local generator used today |
| [lib/store.ts](lib/store.ts) | JSON-file persistence, with read-time migration |
| [lib/ingredients.ts](lib/ingredients.ts) | Parse, format, scale and match ingredients |
| [lib/safety.ts](lib/safety.ts) | **Deterministic food-safety rules** |
| [lib/steps.ts](lib/steps.ts) | Timer extraction from method steps |
| [app/ui/](app/ui/) | **The design system** — tokens and primitives |
| [app/style-guide/page.tsx](app/style-guide/page.tsx) | Live documentation of the system |
| [public/botanical-pattern.svg](public/botanical-pattern.svg) | The botanical backdrop tile |

There are no REST routes. Mutations go through server actions, which are
re-validated server-side because they're reachable by direct POST, not just
through the UI.

### Tested, not just generated

The market problem with AI recipes isn't style, it's trust: generated text looks
identical whether or not anyone has ever cooked it. So this app says which.

A saved recipe carries a **cook log**. Until you've cooked it, it's labelled
`Untested — nobody has cooked this yet`, on the recipe and in the list. When you
cook it you log a rating and, more usefully, **what you changed** ("doubled the
garlic, 20 min was plenty"). Over time the cookbook sorts itself into things
that actually work and things that were only ever suggestions.

This is the one thing the app can do that its competitors structurally can't:
recipe search engines don't generate, and AI generators don't keep what they
made.

### Food safety

[lib/safety.ts](lib/safety.ts) runs a **deterministic rule set** — not a model —
over every recipe before it's shown: garlic stored in oil, dried kidney beans,
rice cooling, poultry and mince doneness, home canning, raw egg and flour.

It's rules on purpose. A generated recipe once told someone to store raw garlic
in oil at room temperature, which is a botulism risk; the model that wrote it
had no idea it was wrong, so asking a model to check itself buys nothing. Rules
are boring, testable and can't hallucinate. They annotate rather than block, and
suppress themselves when the recipe already handles it (tinned beans, a stated
core temperature).

### Cook mode

`/recipes/[id]/cook` is the kitchen view: one step at a time in large type, a
clickable progress bar, per-step timers parsed from the instructions
([lib/steps.ts](lib/steps.ts)), arrow-key navigation, and the **Wake Lock API**
to stop the screen sleeping mid-recipe. Finishing sends you back with the cook
log already open.

### Ingredients are structured

An ingredient is `{ quantity, unit, item, note }`, not a string. That single
change is what makes three features possible:

- **Scaling** — the serving stepper rescales amounts, rounded so you get
  `130 g`, never `133.333 g`, and `½ tbsp`, never `0.5`.
- **Shopping list** — recipe ingredients are diffed against your fridge, so the
  recipe can tell you the four things you still need to buy.
- **Safety** — rules can tell `1 tin kidney beans` (fine) from `200 g dried
  kidney beans` (not).

Text goes in and comes back out — generators write lines, the edit box edits
lines — but [lib/ingredients.ts](lib/ingredients.ts) is the only thing that
converts between the two. Recipes saved before this change are migrated on read,
so old files still open.

### Design system

All styling comes from one place. **Tokens** live in the `:root` block of
[app/globals.css](app/globals.css) — semantic names (`--accent`, `--danger`,
`--muted`) rather than literal ones, which is what lets the dark theme swap
values underneath the same names. They're exposed to Tailwind via
`@theme inline`, so they become real utilities: `bg-card`, `text-muted`,
`border-edge`, `bg-accent-soft`, `rounded-card`, `shadow-card`.

**Components** live in [app/ui/](app/ui/) and are imported from `@/app/ui`:

| Component | Variants |
| --- | --- |
| `Button` / `buttonStyles` | `primary` `secondary` `ghost` `danger` × `sm` `md` `lg` |
| `Field` `Input` `Textarea` `Select` | label + control + hint, one shared control style |
| `Card` | `padding`, `hollow` (empty states), `interactive` (hover lift) |
| `Tag` `RemovableChip` `ToggleChip` | static / removable / on-off pills |
| `Alert` | `danger` (announced to screen readers) or `muted` |
| `PageTitle` `SectionLabel` | the two heading treatments |

Two rules keep it from rotting. **Nothing outside `app/ui/` hard-codes a colour,
radius or button style** — if you need something that isn't there, add it there
first. And `buttonStyles()` exists so a `<Link>` that should look like a button
uses the real definition instead of a copied class string, which is exactly how
five slightly different primary buttons appeared before this existed.

There are no `dark:` variants anywhere: the token layer handles both themes, so
each component is written once.

See **`/style-guide`** for every token, type size, radius and component variant
rendered live. Flip the theme control in the header to check both palettes.

### Theme

Light and dark follow the OS by default. The header control overrides that per
browser, stored in `localStorage` and applied by a small blocking script in
`<head>`. It has to be blocking — anything deferred runs after first paint,
which is visible as the page flipping theme as it loads.

### The backdrop

Every page sits on a repeating tile of botanical line art — a broad leaf, a
rosemary sprig, a citrus half, basil, a chilli, a lemon, a pea pod and mint.
It's applied as a CSS **mask** rather than a background image
(`.botanical-backdrop` in [app/globals.css](app/globals.css)), so the ink colour
comes from `--foreground` and follows the light/dark theme without needing two
files. To change it, edit the single SVG tile; to dial it up or down, change one
`opacity`.

Strokes are kept bold and interior detail sparse on purpose: at 5% opacity, fine
line work turns to mush.

### Storage

Recipes are written to `data/recipes.json` at the project root, created on first
save and gitignored. Writes go through a promise queue and land via a temp file
plus rename, so two concurrent saves can't interleave or truncate the file.

### Generation

Generation currently runs on a **local mock generator** — no API key required.
It sorts your ingredients into proteins, vegetables, starches, dairy, aromatics
and fruit, drops anything your diet rules out, scores nine dish templates
(stir-fry, traybake, pasta, fried rice, frittata, soup, crumble, bowl, skillet)
against the meal and time budget, and writes steps that name your actual
ingredients. Hitting "Try another" picks a different template among the joint
top scorers.

It is not a language model. It produces cookable, plausible output so the rest
of the app is usable and testable today.

**To use a real model**, replace the body of `generateRecipe()` in
[lib/ai/index.ts](lib/ai/index.ts) with a call to your provider. That function is
the only thing the rest of the app knows about: it takes a `GenerateInput` and
returns a `RecipeDraft` (both in [lib/types.ts](lib/types.ts)). Nothing else
needs to change. The file has a worked Anthropic example in its doc comment;
you'd add the SDK and put the key in `.env.local`:

```bash
npm install @anthropic-ai/sdk
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
```

Ask the model for structured output (tool use with a JSON schema) rather than
parsing prose — the `RecipeDraft` shape maps onto a tool schema directly.

## Checks

```bash
npm test          # 49 unit tests, no dependencies — uses node --test
npm run lint
npx tsc --noEmit
npm run build
```

Tests cover the parts where a silent bug destroys data or misleads a cook:
ingredient parsing and scaling, pantry matching, the safety rules (including the
real botulism case), timer extraction, and store migration of pre-existing
recipes.
