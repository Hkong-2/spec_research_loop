"use client";

import { AuthForm } from "@/features/identity";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  return (
    <main style={{ display: "grid", gap: "1rem", maxWidth: 420 }}>
      <h1 style={{ margin: 0 }}>Sign in</h1>
      <AuthForm mode="login" onSuccess={() => router.push("/demo")} />
    </main>
  );
}
