"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoopStage, NodeHeadStatus, type NodeHeadResponse, type WorkflowNode } from "@/lib/api/generated/model";
import { useGetSessionApiLoopSessionsSessionIdGet } from "@/lib/api/generated/endpoints";
import { cn } from "@/lib/utils";

import {
  LOOP_STAGE_CATALOG,
  WORKFLOW_NODE_LABELS,
  catalogStage,
  resolveSelectedStage,
  stageForWorkflowNode,
} from "./catalog";
import { LoopSessionTitleEditor } from "./LoopSessionTitleEditor";
import { WorkingDraftNarrativeEditor } from "./WorkingDraftNarrativeEditor";
import { LoopSessionSaveProvider } from "./loop-session-save";
import { LOOP_STAGE_ICONS } from "./stage-icons";
import {
  deriveStageSignals,
  incompleteUpstreamNodes,
  type CompletionSignal,
} from "./stage-signals";

const COMPLETION_LABEL: Record<CompletionSignal, string> = {
  complete: "Complete",
  needs_work: "Needs work",
  stale: "Stale",
  not_evaluated: "Not evaluated",
};

const NODE_HEAD_LABEL: Record<NodeHeadStatus, string> = {
  [NodeHeadStatus.empty]: "Empty",
  [NodeHeadStatus.current]: "Current",
  [NodeHeadStatus.stale]: "Stale",
};

function completionClass(completion: CompletionSignal): string {
  switch (completion) {
    case "complete":
      return "text-navy";
    case "stale":
      return "text-pending";
    case "not_evaluated":
      return "text-muted-foreground";
    default:
      return "text-in-progress";
  }
}

export function LoopSessionWorkbench({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionQuery = useGetSessionApiLoopSessionsSessionIdGet(sessionId);
  const session = sessionQuery.data?.status === 200 ? sessionQuery.data.data : null;
  const selectedStage = session
    ? resolveSelectedStage(searchParams.get("stage"), session.working_draft_node)
    : null;

  useEffect(() => {
    if (!session || !selectedStage) return;
    if (searchParams.get("stage") === selectedStage) return;
    router.replace(`/sessions/${sessionId}?stage=${selectedStage}`, { scroll: false });
  }, [router, searchParams, selectedStage, session, sessionId]);

  if (sessionQuery.isLoading) {
    return <p className="text-muted-foreground">Loading Loop Session…</p>;
  }
  if (!session || !selectedStage) {
    return (
      <div role="alert" className="rounded-md border border-destructive bg-card p-4">
        <p>We could not load this Loop Session.</p>
        <Button className="mt-3" variant="outline" onClick={() => sessionQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  const selected = catalogStage(selectedStage);
  const selectedSignals = deriveStageSignals({
    stage: selectedStage,
    nodeHeads: session.node_heads,
    workingDraftNode: session.working_draft_node,
  });
  const incompleteUpstream = incompleteUpstreamNodes({
    stage: selectedStage,
    nodeHeads: session.node_heads,
  });

  return (
    <LoopSessionSaveProvider>
    <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 lg:grid-cols-12">
      <aside className="grid gap-4 lg:col-span-3 xl:col-span-3">
        <div className="rounded-md border bg-card p-3 shadow-sm">
          <p className="text-xs font-medium text-muted-foreground">
            Loop Stage {LOOP_STAGE_CATALOG.findIndex((stage) => stage.id === selectedStage) + 1} of{" "}
            {LOOP_STAGE_CATALOG.length}
          </p>
          <p className="font-serif text-lg text-navy">{selected.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Working Draft: {WORKFLOW_NODE_LABELS[session.working_draft_node]}
          </p>
        </div>
        <nav aria-label="Loop Stages" className="rounded-md border bg-card shadow-sm">
          <ol className="flex gap-2 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
            {LOOP_STAGE_CATALOG.map((stage, index) => {
              const signals = deriveStageSignals({
                stage: stage.id,
                nodeHeads: session.node_heads,
                workingDraftNode: session.working_draft_node,
              });
              const Icon = LOOP_STAGE_ICONS[stage.id];
              const active = stage.id === selectedStage;
              return (
                <li key={stage.id} className="min-w-44 lg:min-w-0">
                  <Link
                    href={`/sessions/${sessionId}?stage=${stage.id}`}
                    aria-current={active ? "page" : undefined}
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
                      <StageSignalSummary signals={signals} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      <div className="grid gap-4 lg:col-span-9">
        <p>
          <Link className="text-sm text-in-progress underline-offset-4 hover:underline" href="/sessions">
            ← All Loop Sessions
          </Link>
        </p>
        <LoopSessionTitleEditor sessionId={sessionId} />
        {stageForWorkflowNode(session.working_draft_node) === selectedStage ? (
          <WorkingDraftNarrativeEditor sessionId={sessionId} />
        ) : null}
        <section aria-label={`${selected.name} overview`}>
          <Card>
            <CardHeader>
              <CardTitle className="font-serif text-navy">{selected.name}</CardTitle>
              <CardDescription>{selected.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <StageSignalSummary signals={selectedSignals} />
              {selectedStage === LoopStage.readiness ? (
                <p>Not evaluated. Readiness is a criteria check, not a workflow-completion proxy.</p>
              ) : (
                <WorkflowNodeList
                  nodes={selected.nodes}
                  nodeHeads={session.node_heads}
                  workingDraftNode={session.working_draft_node}
                />
              )}
              {!selectedSignals.available ? (
                <div>
                  <p className="text-sm font-medium text-destructive">Unavailable</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Upstream Workflow Nodes are not current:
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm">
                    {incompleteUpstream.map((node) => (
                      <li key={node}>{WORKFLOW_NODE_LABELS[node]}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
    </LoopSessionSaveProvider>
  );
}

function StageSignalSummary({
  signals,
}: {
  signals: ReturnType<typeof deriveStageSignals>;
}) {
  return (
    <p className={cn("text-xs", completionClass(signals.completion))}>
      {COMPLETION_LABEL[signals.completion]}
      {signals.editing ? " · Editing" : ""}
      {!signals.available ? " · Unavailable" : ""}
    </p>
  );
}

function WorkflowNodeList({
  nodes,
  nodeHeads,
  workingDraftNode,
}: {
  nodes: readonly WorkflowNode[];
  nodeHeads: NodeHeadResponse[];
  workingDraftNode: WorkflowNode;
}) {
  return (
    <ol className="grid gap-3">
      {nodes.map((node) => {
        const head = nodeHeads.find((item) => item.node === node);
        const status = head?.status ?? NodeHeadStatus.empty;
        return (
          <li key={node} className="rounded-md border bg-muted/40 px-3 py-2">
            <p className="text-sm font-medium">{WORKFLOW_NODE_LABELS[node]}</p>
            <p className="text-sm text-muted-foreground">
              Node Head: {NODE_HEAD_LABEL[status]}
              {workingDraftNode === node ? " · Working Draft" : ""}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
