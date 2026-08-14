import type { Metadata } from "next";
import Link from "next/link";

import { AppProviders } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "SpecResearch Loop",
  description: "Turn a vague research idea into a verified research specification.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-svh antialiased">
        <AppProviders>
          <header className="border-b bg-card">
            <nav className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3 text-sm">
              <Link href="/" className="font-medium">
                SpecResearch Loop
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                Login
              </Link>
              <Link href="/register" className="text-muted-foreground hover:text-foreground">
                Register
              </Link>
              <Link href="/demo" className="text-muted-foreground hover:text-foreground">
                SSE demo
              </Link>
            </nav>
          </header>
          <div className="mx-auto max-w-5xl px-6 py-8">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}
