"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const NAV = [
  { href: "/demo", label: "Loop Session" },
  { href: "/login", label: "Sign in" },
  { href: "/register", label: "Create Account" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 h-[var(--header-height)] border-b border-navy bg-navy text-navy-foreground">
      <nav className="mx-auto flex h-full max-w-7xl items-center gap-6 px-4 text-sm sm:px-6">
        <Link
          href="/"
          className="font-display text-lg tracking-tight text-navy-foreground focus-visible:outline-navy-foreground"
          aria-current={pathname === "/" ? "page" : undefined}
        >
          SpecResearch Loop
        </Link>
        <div className="ml-auto flex items-center gap-4">
          {NAV.map((item) => {
            const current = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "cursor-pointer text-navy-foreground/80 transition-colors duration-200 hover:text-navy-foreground focus-visible:outline-navy-foreground",
                  current && "text-navy-foreground underline decoration-primary underline-offset-4",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
