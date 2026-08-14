"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, FlaskConical, Library, ListChecks, MessageSquare, Scale } from "lucide-react";

import { API_BASE_URL, getStoredToken, setStoredToken } from "@/lib/api";
import { useMeApiIdentityMeGet } from "@/lib/api/generated/endpoints";
import { LOOP_STAGES } from "@/lib/loop-stages";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const STAGE_ICONS = {
  grilling: MessageSquare,
  "related-work": Library,
  claims: BadgeCheck,
  experiments: FlaskConical,
  judges: Scale,
  readiness: ListChecks,
} as const;

export default function HomePage() {
  const [token, setToken] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    setToken(getStoredToken());
  }, []);

  const meQuery = useMeApiIdentityMeGet({
    query: { enabled: Boolean(token), retry: false },
  });

  const email = meQuery.data?.status === 200 ? meQuery.data.data.email : null;
  const signedIn = Boolean(email);
  const status = !token
    ? "Signed out"
    : meQuery.isLoading
      ? "Checking Account…"
      : email
        ? "Signed in"
        : "Signed out (token invalid)";

  return (
    <div>
      <section className="border-b bg-card">
        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-16 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <h1 className="font-display text-4xl leading-tight text-navy sm:text-5xl">
              Turn a vague research idea into a verified Research Spec.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              SpecResearch Loop is a human-in-the-loop workflow: grilling, related work,
              claims and evidence, experiment planning, and independent judges.
            </p>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              The system evaluates readiness criteria. It does not guarantee conference acceptance.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/demo" className={cn(buttonVariants({ size: "lg" }))}>
                {signedIn ? "Continue Loop Session" : "Start a Loop Session"}
              </Link>
              {signedIn ? (
                <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  Account
                </Link>
              ) : (
                <Link href="/login" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h2 className="font-serif text-2xl text-navy">How a Loop Session works</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          You confirm each stage. Nothing is autopilot research.
        </p>
        <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {LOOP_STAGES.map((stage, index) => {
            const Icon = STAGE_ICONS[stage.id];
            return (
              <li key={stage.id} className="rounded-md border bg-card p-4 shadow-sm">
                <Icon aria-hidden="true" className="size-5 text-navy" />
                <p className="mt-3 text-sm font-medium text-muted-foreground">Stage {index + 1}</p>
                <h3 className="font-serif text-xl text-navy">{stage.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{stage.description}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-y bg-muted">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <blockquote className="font-display text-2xl text-navy sm:text-3xl">
            Readiness is a criteria check, not a conference decision.
          </blockquote>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            Independent judges and a Research Spec you confirm. Export a Spec Artifact when the
            Loop Session is ready — not a promise that a venue will accept the work.
          </p>
        </div>
      </section>
    </div>
  );
}
