/**
 * Shown while a server component is fetching. The pages that read recipes from
 * disk are dynamic, so without this the browser sits on the old page with no
 * sign anything is happening.
 */
export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-8 w-1/3 animate-pulse rounded-field bg-card" />
      <div className="h-4 w-2/3 animate-pulse rounded-field bg-card" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-card bg-card" />
        ))}
      </div>
    </div>
  );
}
