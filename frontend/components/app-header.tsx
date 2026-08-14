"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAccount } from "@/features/identity";
import { cn } from "@/lib/utils";

const linkClass =
  "cursor-pointer text-navy-foreground/80 transition-colors duration-200 hover:text-navy-foreground focus-visible:outline-navy-foreground";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { ready, signedIn, email, isLoading, signOut } = useAccount();

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
          <Link
            href="/demo"
            aria-current={pathname === "/demo" ? "page" : undefined}
            className={cn(linkClass, pathname === "/demo" && "text-navy-foreground underline decoration-primary underline-offset-4")}
          >
            Loop Session
          </Link>
          {!ready || isLoading ? (
            <span className="text-navy-foreground/80" aria-live="polite">
              Checking Account…
            </span>
          ) : signedIn && email ? (
            <>
              <p className="max-w-48 truncate text-navy-foreground" title={email}>
                <span className="sr-only">Signed in as </span>
                {email}
              </p>
              <button
                type="button"
                className={linkClass}
                onClick={() => {
                  signOut();
                  router.push("/");
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                aria-current={pathname === "/login" ? "page" : undefined}
                className={cn(linkClass, pathname === "/login" && "text-navy-foreground underline decoration-primary underline-offset-4")}
              >
                Sign in
              </Link>
              <Link
                href="/register"
                aria-current={pathname === "/register" ? "page" : undefined}
                className={cn(
                  linkClass,
                  pathname === "/register" && "text-navy-foreground underline decoration-primary underline-offset-4",
                )}
              >
                Create Account
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
