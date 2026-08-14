"use client";

import { AuthForm } from "@/features/identity";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-navy">Sign in</CardTitle>
          <CardDescription>Access Loop Sessions owned by this Account.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="login" onSuccess={() => router.push("/demo")} />
        </CardContent>
      </Card>
    </div>
  );
}
