import type { ReactNode } from "react";
import {
  BadgeCheck,
  FlaskConical,
  Library,
  ListChecks,
  MessageSquare,
  Scale,
} from "lucide-react";

import {
  LOOP_STAGES,
  STAGE_STATUS_LABEL,
  stageIndex,
  type LoopStageId,
  type StageStatus,
} from "@/lib/loop-stages";
import { cn } from "@/lib/utils";

const STAGE_ICONS = {
  grilling: MessageSquare,
  "related-work": Library,
  claims: BadgeCheck,
  experiments: FlaskConical,
  judges: Scale,
  readiness: ListChecks,
} as const;

function statusClass(status: StageStatus): string {
  switch (status) {
    case "confirmed":
      return "text-navy";
    case "in-review":
      return "text-in-progress";
    case "blocked":
      return "text-destructive";
    default:
      return "text-pending";
  }
}

function ReadinessWaffle({ filled = 0 }: { filled?: number }) {
  return (
    <div className="grid gap-2">
      <div
        role="img"
        aria-label={`${filled}% of readiness criteria met`}
        className="grid grid-cols-10 gap-0.5"
      >
        {Array.from({ length: 100 }, (_, index) => (
          <span
            key={index}
            className={cn(
              "size-2 rounded-[1px]",
              index < filled ? "bg-navy" : "bg-muted",
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        {filled}% of readiness criteria met. The system evaluates readiness; it
        does not guarantee conference acceptance.
      </p>
    </div>
  );
}

export function LoopSessionShell({
  currentStageId,
  stageStatus,
  children,
}: {
  currentStageId: LoopStageId;
  stageStatus?: Partial<Record<LoopStageId, StageStatus>>;
  children: ReactNode;
}) {
  const current = LOOP_STAGES.find((stage) => stage.id === currentStageId);
  const currentNumber = stageIndex(currentStageId);

  return (
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-4 lg:grid-cols-12 sm:px-6">
      <aside className="grid gap-4 lg:col-span-3 xl:col-span-2">
        <div className="rounded-md border bg-card p-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Stage {currentNumber} of {LOOP_STAGES.length}
          </p>
          <p className="font-serif text-lg text-navy">{current?.name}</p>
        </div>
        <nav aria-label="Loop Session stages" className="rounded-md border bg-card shadow-sm">
          <ol className="flex gap-2 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
            {LOOP_STAGES.map((stage, index) => {
              const status = stageStatus?.[stage.id] ?? (stage.id === currentStageId ? "in-review" : "pending");
              const Icon = STAGE_ICONS[stage.id];
              const active = stage.id === currentStageId;
              return (
                <li key={stage.id} className="min-w-40 lg:min-w-0">
                  <div
                    className={cn(
                      "flex items-start gap-2 rounded-md px-2 py-2",
                      active && "border-l-2 border-navy bg-muted lg:rounded-l-none",
                    )}
                  >
                    <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-navy" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {index + 1}. {stage.name}
                      </p>
                      <p className={cn("text-xs", statusClass(status))}>{STAGE_STATUS_LABEL[status]}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
        <div className="rounded-md border bg-card p-3 shadow-sm">
          <h2 className="mb-2 text-sm font-medium text-navy">Readiness</h2>
          <ReadinessWaffle filled={0} />
        </div>
      </aside>

      <main className="lg:col-span-9 xl:col-span-7">{children}</main>

      <aside className="hidden xl:col-span-3 xl:block">
        <div className="sticky top-[calc(var(--header-height)+1rem)] rounded-md border bg-card p-4 shadow-sm">
          <h2 className="font-serif text-lg text-navy">Draft Research Spec</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirmed sections will appear here as the Loop Session progresses.
          </p>
          <h3 className="mt-4 text-sm font-medium text-navy">Open questions</h3>
          <p className="mt-1 text-sm text-muted-foreground">None yet.</p>
        </div>
      </aside>
    </div>
  );
}
