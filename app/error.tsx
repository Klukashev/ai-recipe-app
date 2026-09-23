"use client";

import { Button, Card, PageTitle } from "@/app/ui";

/**
 * Route-level error boundary. Without this, an unhandled server error shows
 * Next's bare default page, which tells a cook nothing and offers no way back.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card hollow padding="lg" className="space-y-4 text-center">
      <PageTitle className="text-xl">That didn&apos;t work</PageTitle>
      <p className="mx-auto max-w-md text-sm text-muted">
        Something failed while loading this page. Trying again usually fixes it;
        if it doesn&apos;t, the server console has the details.
      </p>
      {error.digest && (
        <p className="font-mono text-xs text-muted">Reference: {error.digest}</p>
      )}
      <div className="flex justify-center gap-3 pt-2">
        <Button onClick={reset}>Try again</Button>
      </div>
    </Card>
  );
}
