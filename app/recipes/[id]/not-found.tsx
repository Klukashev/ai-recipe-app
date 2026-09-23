import Link from "next/link";

import { buttonStyles, Card, PageTitle } from "@/app/ui";

export default function RecipeNotFound() {
  return (
    <Card hollow padding="lg" className="text-center">
      <PageTitle className="text-xl">That recipe isn&apos;t here</PageTitle>
      <p className="mt-2 text-sm text-muted">
        It may have been deleted, or the link is wrong.
      </p>
      <Link href="/recipes" className={buttonStyles({ className: "mt-6" })}>
        Back to my recipes
      </Link>
    </Card>
  );
}
