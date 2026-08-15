import { Suspense } from "react";

import { SessionsDashboard } from "@/features/loop/SessionsDashboard";

export default function SessionsPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Suspense fallback={<p className="text-muted-foreground">Loading Loop Sessions…</p>}>
        <SessionsDashboard />
      </Suspense>
    </main>
  );
}
