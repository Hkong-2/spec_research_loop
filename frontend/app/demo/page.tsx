"use client";

import { SseDemoPanel } from "@/features/idea";
import { getStoredToken } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function DemoPage() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getStoredToken()));
    setReady(true);
  }, []);

  if (!ready) return <p className="text-muted-foreground">Loading…</p>;

  if (!authed) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Sign in required</CardTitle>
          <CardDescription>The SSE demo needs a Bearer token.</CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Link href="/login" className={cn(buttonVariants())}>
            Login
          </Link>
          <Link href="/register" className={cn(buttonVariants({ variant: "outline" }))}>
            Register
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-3xl">
      <CardHeader>
        <CardTitle>SSE demo</CardTitle>
        <CardDescription>
          In-request Server-Sent Events from <code>/api/idea/demo/stream</code> with Bearer JWT.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SseDemoPanel />
      </CardContent>
    </Card>
  );
}
