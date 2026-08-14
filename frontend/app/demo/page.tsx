"use client";

import { SseDemoPanel } from "@/features/idea";
import { getStoredToken } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function DemoPage() {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getStoredToken()));
    setReady(true);
  }, []);

  if (!ready) return <p>Loading…</p>;

  if (!authed) {
    return (
      <main>
        <p>
          Sign in required for the SSE demo.{" "}
          <Link href="/login">Login</Link> or <Link href="/register">Register</Link>.
        </p>
      </main>
    );
  }

  return (
    <main style={{ display: "grid", gap: "1rem", maxWidth: 720 }}>
      <h1 style={{ margin: 0 }}>SSE demo</h1>
      <p style={{ margin: 0 }}>
        In-request Server-Sent Events from <code>/api/idea/demo/stream</code> with Bearer
        JWT.
      </p>
      <SseDemoPanel />
    </main>
  );
}
