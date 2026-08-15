"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useAccount } from "@/features/identity";
import { loginDestination } from "@/lib/auth-return";

import { LoopSessionTitleEditor } from "./LoopSessionTitleEditor";

export function AuthenticatedLoopSession({ sessionId }: { sessionId: string }) {
  const account = useAccount();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const returnTo = `${pathname}${searchParams.size ? `?${searchParams.toString()}` : ""}`;

  useEffect(() => {
    if (account.ready && !account.hasToken) {
      router.replace(loginDestination(returnTo));
    }
  }, [account.hasToken, account.ready, returnTo, router]);

  if (!account.ready || account.isLoading || (account.hasToken && !account.signedIn)) {
    return <p className="text-muted-foreground">Checking Account…</p>;
  }
  if (!account.hasToken) {
    return <p className="text-muted-foreground">Redirecting to sign in…</p>;
  }
  return <LoopSessionTitleEditor sessionId={sessionId} />;
}
