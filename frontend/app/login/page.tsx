"use client";

import { AuthForm } from "@/features/identity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent>
        <AuthForm mode="login" onSuccess={() => router.push("/demo")} />
      </CardContent>
    </Card>
  );
}
