import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

import { buttonStyles, ThemeToggle } from "@/app/ui";

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

/**
 * Applies a saved theme before the first paint. It has to be a blocking inline
 * script in <head>: anything later (a React effect, a deferred bundle) runs
 * after the browser has already painted, which is visible as a flash of the
 * wrong theme on every page load.
 */
const NO_FLASH_SCRIPT = `try{var t=localStorage.getItem('fridge-chef:theme');if(t==='dark'||t==='light')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

const NAV = [
  { href: "/", label: "Generate" },
  { href: "/recipes", label: "My recipes" },
] as const;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className="font-sans min-h-full flex flex-col bg-background text-foreground">
        {/* Decorative only — sits behind all content and is hidden from screen readers. */}
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 page-glow" />
        <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 botanical-backdrop" />

        <header className="border-b border-edge">
          <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-4 px-5 py-4">
            <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
              <span aria-hidden className="text-xl">🍳</span>
              Fridge Chef
            </Link>
            <div className="flex items-center gap-2">
              <nav className="flex items-center gap-1">
                {NAV.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={buttonStyles({ variant: "ghost", size: "sm" })}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-8 sm:py-12">
          {children}
        </main>

        <footer className="border-t border-edge">
          <div className="mx-auto w-full max-w-4xl px-5 py-6 text-xs text-muted">
            Recipes are saved to <code className="font-mono">data/recipes.json</code> on this
            machine. Generation currently runs on the local mock generator — swap it in{" "}
            <code className="font-mono">lib/ai/index.ts</code>. Design tokens and components
            live in <Link href="/style-guide" className="underline underline-offset-2 hover:text-accent">the style guide</Link>.
          </div>
        </footer>
      </body>
    </html>
  );
}
