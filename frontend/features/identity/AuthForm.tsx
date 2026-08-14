"use client";

import { FormEvent, useState } from "react";
import { login, register, setStoredToken } from "@/lib/api";

type Mode = "login" | "register";

export function AuthForm({
  mode,
  onSuccess,
}: {
  mode: Mode;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result =
        mode === "login"
          ? await login(email, password)
          : await register(email, password);
      setStoredToken(result.access_token);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem", maxWidth: 360 }}>
      <label style={{ display: "grid", gap: "0.25rem" }}>
        Email
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </label>
      <label style={{ display: "grid", gap: "0.25rem" }}>
        Password
        <input
          type="password"
          required
          minLength={mode === "register" ? 8 : 1}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </label>
      {error ? <p style={{ color: "crimson", margin: 0 }}>{error}</p> : null}
      <button type="submit" disabled={pending}>
        {pending ? "Working…" : mode === "login" ? "Sign in" : "Create Account"}
      </button>
    </form>
  );
}
