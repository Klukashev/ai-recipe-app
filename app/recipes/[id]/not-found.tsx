import Link from "next/link";

export default function RecipeNotFound() {
  return (
    <div className="rounded-xl border border-dashed border-edge p-10 text-center">
      <h1 className="text-xl font-semibold">That recipe isn&apos;t here</h1>
      <p className="mt-2 text-sm text-muted">
        It may have been deleted, or the link is wrong.
      </p>
      <Link
        href="/recipes"
        className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
      >
        Back to my recipes
      </Link>
    </div>
  );
}
