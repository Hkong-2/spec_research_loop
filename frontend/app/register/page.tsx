"use client";

import { AuthForm } from "@/features/identity";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  return (
    <main style={{ display: "grid", gap: "1rem", maxWidth: 420 }}>
      <h1 style={{ margin: 0 }}>Create Account</h1>
      <AuthForm mode="register" onSuccess={() => router.push("/demo")} />
    </main>
  );
}
