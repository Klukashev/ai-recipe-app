import {
  Alert,
  Card,
  Field,
  Input,
  PageTitle,
  SectionLabel,
  Select,
  Tag,
  Textarea,
} from "@/app/ui";
import { ChipDemo, ButtonMatrix } from "./demos";

export const metadata = {
  title: "Style guide — Fridge Chef",
};

const COLORS = [
  { token: "--background", utility: "bg-background", note: "Page ground" },
  { token: "--card", utility: "bg-card", note: "Raised surfaces" },
  { token: "--border", utility: "border-edge", note: "All hairlines" },
  { token: "--foreground", utility: "text-foreground", note: "Body text" },
  { token: "--muted", utility: "text-muted", note: "Secondary text" },
  { token: "--accent", utility: "bg-accent", note: "Primary actions" },
  { token: "--accent-contrast", utility: "text-accent-contrast", note: "Ink on accent" },
  { token: "--accent-soft", utility: "bg-accent-soft", note: "Selected pills" },
  { token: "--danger", utility: "text-danger", note: "Errors, destructive" },
];

const RADII = [
  { name: "rounded-field", note: "Inputs, selects, small surfaces" },
  { name: "rounded-card", note: "Cards and panels" },
  { name: "rounded-panel", note: "Large containers" },
  { name: "rounded-full", note: "Buttons and pills" },
];

const TYPE = [
  { cls: "text-3xl font-semibold tracking-tight", label: "PageTitle — one per page" },
  { cls: "text-2xl font-semibold tracking-tight", label: "text-2xl — sub-page heading" },
  { cls: "text-sm font-semibold uppercase tracking-wide text-muted", label: "SectionLabel" },
  { cls: "text-base", label: "text-base — body" },
  { cls: "text-sm", label: "text-sm — default UI size" },
  { cls: "text-xs text-muted", label: "text-xs — hints and metadata" },
  { cls: "font-mono text-xs", label: "font-mono — line-per-item editing" },
];

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <SectionLabel>{title}</SectionLabel>
      {children}
    </section>
  );
}

export default function StyleGuidePage() {
  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <PageTitle>Style guide</PageTitle>
        <p className="max-w-2xl text-muted leading-relaxed">
          Every token and component the site is built from. Nothing outside{" "}
          <code className="font-mono text-sm">app/ui/</code> should invent its own colour,
          radius or button — if something you need isn&apos;t here, add it here first.
          Flip the theme control in the header to check both palettes.
        </p>
      </header>

      <Row title="Colour">
        <div className="grid gap-3 sm:grid-cols-2">
          {COLORS.map((color) => (
            <Card key={color.token} padding="sm" className="flex items-center gap-3">
              <span
                aria-hidden
                className={`size-10 shrink-0 rounded-field border border-edge ${
                  color.utility.startsWith("bg-") ? color.utility : "bg-card"
                }`}
              >
                {!color.utility.startsWith("bg-") && (
                  <span className={`flex size-full items-center justify-center text-lg font-bold ${color.utility}`}>
                    A
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <code className="block font-mono text-xs">{color.token}</code>
                <code className="block font-mono text-xs text-muted">{color.utility}</code>
                <span className="text-xs text-muted">{color.note}</span>
              </span>
            </Card>
          ))}
        </div>
      </Row>

      <Row title="Type scale">
        <Card className="space-y-4">
          {TYPE.map((entry) => (
            <div key={entry.label} className="flex flex-wrap items-baseline justify-between gap-2">
              <span className={entry.cls}>The quick brown fox</span>
              <code className="font-mono text-xs text-muted">{entry.label}</code>
            </div>
          ))}
        </Card>
      </Row>

      <Row title="Radius">
        <div className="flex flex-wrap gap-4">
          {RADII.map((radius) => (
            <div key={radius.name} className="space-y-2">
              <div
                className={`size-20 border border-edge bg-card ${radius.name}`}
                aria-hidden
              />
              <code className="block font-mono text-xs">{radius.name}</code>
              <span className="block max-w-[10rem] text-xs text-muted">{radius.note}</span>
            </div>
          ))}
        </div>
      </Row>

      <Row title="Buttons">
        <Card className="space-y-6">
          <ButtonMatrix />
        </Card>
      </Row>

      <Row title="Form controls">
        <Card className="grid gap-4 sm:grid-cols-2">
          <Field htmlFor="sg-input" label="Input" hint="A hint sits under the control.">
            <Input id="sg-input" placeholder="half a cabbage, 3 eggs…" />
          </Field>
          <Field htmlFor="sg-select" label="Select">
            <Select id="sg-select" defaultValue="dinner">
              <option value="breakfast">breakfast</option>
              <option value="dinner">dinner</option>
            </Select>
          </Field>
          <Field htmlFor="sg-number" label="Number">
            <Input id="sg-number" type="number" defaultValue={2} min={1} max={12} />
          </Field>
          <Field htmlFor="sg-disabled" label="Disabled">
            <Input id="sg-disabled" defaultValue="Not editable" disabled />
          </Field>
          <Field htmlFor="sg-textarea" label="Textarea" className="sm:col-span-2">
            <Textarea id="sg-textarea" rows={2} placeholder="no oven, something spicy…" />
          </Field>
        </Card>
      </Row>

      <Row title="Pills">
        <Card className="space-y-5">
          <ChipDemo />
          <div className="space-y-2">
            <p className="text-xs text-muted">Tag — static metadata, not interactive</p>
            <ul className="flex flex-wrap gap-1.5">
              {["stir-fry", "quick", "one-pan", "vegan"].map((tag) => (
                <li key={tag}>
                  <Tag>{tag}</Tag>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </Row>

      <Row title="Surfaces">
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <p className="text-sm">Card — the default raised surface.</p>
          </Card>
          <Card interactive>
            <p className="text-sm">Card interactive — border lifts on hover.</p>
          </Card>
          <Card hollow>
            <p className="text-sm text-muted">Card hollow — empty states.</p>
          </Card>
        </div>
      </Row>

      <Row title="Messages">
        <div className="space-y-3">
          <Alert>Something failed. This is announced to screen readers.</Alert>
          <Alert tone="muted">A quiet, non-urgent note.</Alert>
        </div>
      </Row>
    </div>
  );
}
