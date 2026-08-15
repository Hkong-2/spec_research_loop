"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { AuthForm } from "@/features/identity";
import { safeReturnDestination } from "@/lib/auth-return";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = safeReturnDestination(searchParams.get("returnTo"));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-navy">Sign in</CardTitle>
        <CardDescription>Access Loop Sessions owned by this Account.</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="login" onSuccess={() => router.replace(returnTo)} />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Suspense fallback={<p className="text-muted-foreground">Loading sign in…</p>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
