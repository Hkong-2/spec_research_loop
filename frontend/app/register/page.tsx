"use client";

import { AuthForm } from "@/features/identity";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  return (
    <div className="mx-auto max-w-md px-6 py-10">
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-navy">Create Account</CardTitle>
          <CardDescription>An Account owns Loop Sessions you can save and resume.</CardDescription>
        </CardHeader>
        <CardContent>
          <AuthForm mode="register" onSuccess={() => router.push("/sessions")} />
        </CardContent>
      </Card>
    </div>
  );
}
