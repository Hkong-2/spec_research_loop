"use client";

import { useEffect, useRef, useState } from "react";
import { readSseStream } from "@/lib/api";

type LogItem = { at: string; payload: unknown };

export function SseDemoPanel() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  async function start() {
    setError(null);
    setLogs([]);
    setRunning(true);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await readSseStream(
        "/api/idea/demo/stream",
        (payload) => {
          setLogs((prev) => [
            ...prev,
            { at: new Date().toLocaleTimeString(), payload },
          ]);
        },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setError(err instanceof Error ? err.message : "SSE failed");
      }
    } finally {
      setRunning(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  return (
    <section style={{ display: "grid", gap: "0.75rem" }}>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <button type="button" onClick={start} disabled={running}>
          {running ? "Streaming…" : "Start SSE demo"}
        </button>
        <button type="button" onClick={stop} disabled={!running}>
          Stop
        </button>
      </div>
      {error ? <p style={{ color: "crimson", margin: 0 }}>{error}</p> : null}
      <pre
        style={{
          background: "#111",
          color: "#eee",
          padding: "1rem",
          borderRadius: 8,
          minHeight: 160,
          overflow: "auto",
        }}
      >
        {logs.length === 0
          ? "Events will appear here."
          : logs.map((item) => `${item.at} ${JSON.stringify(item.payload)}`).join("\n")}
      </pre>
    </section>
  );
}
