"use client";

import { SseDemoPanel } from "@/features/idea";
import { useAccount } from "@/features/identity";
import { LoopSessionShell } from "@/components/loop-session-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DemoPage() {
  const { ready, signedIn, hasToken, isLoading } = useAccount();

  if (!ready || (hasToken && isLoading)) {
    return (
      <p className="px-6 py-8 text-muted-foreground" aria-live="polite">
        Loading Loop Session…
      </p>
    );
  }

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-lg px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
            <CardDescription>
              A Loop Session is saved to your Account. Sign in to continue grilling.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-3">
            <Link href="/login" className={cn(buttonVariants())}>
              Sign in
            </Link>
            <Link href="/register" className={cn(buttonVariants({ variant: "outline" }))}>
              Create Account
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <LoopSessionShell currentStageId="grilling">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-navy">Grilling</CardTitle>
          <CardDescription>
            Streaming questions from <code>/api/idea/demo/stream</code>. Confirm answers in later
            stages; this demo only shows the event stream.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SseDemoPanel />
        </CardContent>
      </Card>
    </LoopSessionShell>
  );
}
