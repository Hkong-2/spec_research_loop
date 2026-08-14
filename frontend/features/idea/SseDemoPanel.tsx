"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { readSseStream } from "@/lib/api";

type LogItem = { id: string; at: string; payload: unknown };

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
            {
              id: crypto.randomUUID(),
              at: new Date().toLocaleTimeString(),
              payload,
            },
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
    <section className="grid gap-3">
      <div className="flex gap-2">
        <Button type="button" onClick={start} disabled={running}>
          {running ? "Streaming…" : "Start grilling stream"}
        </Button>
        <Button type="button" variant="outline" onClick={stop} disabled={!running}>
          Stop
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <ol className="min-h-40 list-none overflow-auto rounded-md bg-navy p-4 font-mono text-sm text-navy-foreground">
        {logs.length === 0 ? (
          <li className="list-none text-navy-foreground/80">Events will appear here.</li>
        ) : (
          logs.map((item) => (
            <li key={item.id} className="whitespace-pre-wrap">
              {item.at} {JSON.stringify(item.payload)}
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
