import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fridge Chef — what's for dinner?",
  description:
    "Tell it what's in your fridge and get a recipe you can actually cook, then save and edit it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="font-sans min-h-full flex flex-col bg-background text-foreground">
        {/* Decorative only — sits behind all content and is hidden from screen readers. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 kitchen-glow" />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 kitchen-backdrop" />

        <header className="border-b border-edge">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span aria-hidden className="text-xl">🍳</span>
              Fridge Chef
            </Link>
            <nav className="flex items-center gap-1 text-sm">
              <Link
                href="/"
                className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-card hover:text-foreground"
              >
                Generate
              </Link>
              <Link
                href="/recipes"
                className="rounded-full px-3 py-1.5 text-muted transition-colors hover:bg-card hover:text-foreground"
              >
                My recipes
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:py-12">
          {children}
        </main>

        <footer className="border-t border-edge">
          <div className="mx-auto w-full max-w-4xl px-5 py-6 text-xs text-muted">
            Recipes are saved to <code className="font-mono">data/recipes.json</code> on this
            machine. Generation currently runs on the local mock generator — swap it in{" "}
            <code className="font-mono">lib/ai/index.ts</code>.
          </div>
        </footer>
      </body>
    </html>
  );
}
