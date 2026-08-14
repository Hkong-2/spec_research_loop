"use client";

import { API_BASE_URL, getStoredToken, me, setStoredToken } from "@/lib/api";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [email, setEmail] = useState<string | null>(null);
  const [status, setStatus] = useState("Checking session…");

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setStatus("Signed out");
      return;
    }
    me()
      .then((account) => {
        setEmail(account.email);
        setStatus("Signed in");
      })
      .catch(() => {
        setStoredToken(null);
        setStatus("Signed out (token invalid)");
      });
  }, []);

  return (
    <main style={{ display: "grid", gap: "0.75rem", maxWidth: 640 }}>
      <h1 style={{ margin: 0 }}>SpecResearch Loop</h1>
      <p style={{ margin: 0 }}>
        SPA shell over FastAPI. API base: <code>{API_BASE_URL}</code>
      </p>
      <p style={{ margin: 0 }}>
        Status: <strong>{status}</strong>
        {email ? (
          <>
            {" "}
            as <code>{email}</code>
          </>
        ) : null}
      </p>
      {email ? (
        <button
          type="button"
          onClick={() => {
            setStoredToken(null);
            setEmail(null);
            setStatus("Signed out");
          }}
        >
          Sign out
        </button>
      ) : null}
    </main>
  );
}
