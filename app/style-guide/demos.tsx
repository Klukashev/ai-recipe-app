"use client";

import { useState } from "react";

import {
  Button,
  RemovableChip,
  ToggleChip,
  type ButtonSize,
  type ButtonVariant,
} from "@/app/ui";

/**
 * The interactive parts of the style guide. Split into their own client
 * component so the page itself stays a server component.
 */

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "ghost", "danger"];
const SIZES: ButtonSize[] = ["sm", "md", "lg"];

export function ButtonMatrix() {
  return (
    <>
      {VARIANTS.map((variant) => (
        <div key={variant} className="space-y-2">
          <p className="font-mono text-xs text-muted">variant=&quot;{variant}&quot;</p>
          <div className="flex flex-wrap items-center gap-3">
            {SIZES.map((size) => (
              <Button key={size} variant={variant} size={size}>
                {size}
              </Button>
            ))}
            <Button variant={variant} disabled>
              disabled
            </Button>
          </div>
        </div>
      ))}
    </>
  );
}

export function ChipDemo() {
  const [items, setItems] = useState(["eggs", "spinach", "cheddar"]);
  const [diets, setDiets] = useState<string[]>(["vegetarian"]);

  return (
    <>
      <div className="space-y-2">
        <p className="text-xs text-muted">RemovableChip — click to remove</p>
        <ul className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <li key={item}>
              <RemovableChip
                removeLabel={`Remove ${item}`}
                onRemove={() => setItems(items.filter((i) => i !== item))}
              >
                {item}
              </RemovableChip>
            </li>
          ))}
          {items.length === 0 && (
            <li>
              <button
                type="button"
                onClick={() => setItems(["eggs", "spinach", "cheddar"])}
                className="text-xs text-muted underline underline-offset-2 hover:text-accent"
              >
                reset
              </button>
            </li>
          )}
        </ul>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted">ToggleChip — on/off, click them</p>
        <div className="flex flex-wrap gap-1.5">
          {["vegetarian", "vegan", "gluten-free", "low-carb"].map((diet) => (
            <ToggleChip
              key={diet}
              pressed={diets.includes(diet)}
              onToggle={() =>
                setDiets(
                  diets.includes(diet)
                    ? diets.filter((d) => d !== diet)
                    : [...diets, diet],
                )
              }
            >
              {diet}
            </ToggleChip>
          ))}
        </div>
      </div>
    </>
  );
}
