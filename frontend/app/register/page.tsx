"use client";

import { AuthForm } from "@/features/identity";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
      </CardHeader>
      <CardContent>
        <AuthForm mode="register" onSuccess={() => router.push("/demo")} />
      </CardContent>
    </Card>
  );
}
