"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
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
          setLogs((prev) => [...prev, { at: new Date().toLocaleTimeString(), payload }]);
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
    <section className="grid gap-3">
      <div className="flex gap-2">
        <Button type="button" onClick={start} disabled={running}>
          {running ? "Streaming…" : "Start SSE demo"}
        </Button>
        <Button type="button" variant="outline" onClick={stop} disabled={!running}>
          Stop
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <pre className="min-h-40 overflow-auto rounded-lg bg-zinc-950 p-4 text-sm text-zinc-100">
        {logs.length === 0
          ? "Events will appear here."
          : logs.map((item) => `${item.at} ${JSON.stringify(item.payload)}`).join("\n")}
      </pre>
    </section>
  );
}
