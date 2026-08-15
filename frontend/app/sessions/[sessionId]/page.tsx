import { Suspense } from "react";

import { AuthenticatedLoopSession } from "@/features/loop/AuthenticatedLoopSession";

export default async function LoopSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <Suspense fallback={<p className="text-muted-foreground">Loading Loop Session…</p>}>
        <AuthenticatedLoopSession sessionId={sessionId} />
      </Suspense>
    </main>
  );
}
