"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getApiErrorMessage } from "@/lib/api/config";
import {
  getGetSessionApiLoopSessionsSessionIdGetQueryKey,
  useGetSessionApiLoopSessionsSessionIdGet,
  usePatchWorkingDraftApiLoopSessionsSessionIdWorkingDraftPatch,
  useRecomputePrepareApiLoopSessionsSessionIdRecomputePreparePost,
} from "@/lib/api/generated/endpoints";
import {
  LoopStage,
  NodeHeadStatus,
  type LoopSessionResponse,
  type NodeHeadResponse,
  type OperationalError,
  type WorkflowNode,
} from "@/lib/api/generated/model";
import { cn } from "@/lib/utils";

import {
  LOOP_STAGE_CATALOG,
  WORKFLOW_NODE_LABELS,
  catalogStage,
  resolveSelectedStage,
  stageForWorkflowNode,
} from "./catalog";
import { LoopSessionTitleEditor } from "./LoopSessionTitleEditor";
import { WorkingDraftCardCanvas } from "./WorkingDraftCardCanvas";
import { WorkingDraftNarrativeEditor } from "./WorkingDraftNarrativeEditor";
import { LoopSessionSaveProvider, useLoopSessionSave } from "./loop-session-save";
import { operationalError } from "./operational-error";
import { LOOP_STAGE_ICONS } from "./stage-icons";
import {
  deriveStageActions,
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

function newerSession(
  current: LoopSessionResponse | null,
  candidate: LoopSessionResponse | null,
): LoopSessionResponse | null {
  if (!current) return candidate;
  if (!candidate) return current;
  return candidate.version >= current.version ? candidate : current;
}

function transitionMessage(error: OperationalError): string {
  switch (error.code) {
    case "version_conflict":
      return "Another request changed this Loop Session (version conflict). Your current Working Draft was kept.";
    case "upstream_not_current":
      return "Upstream Workflow Nodes are not current. Your current Working Draft was kept.";
    case "stage_already_current":
      return "Every Workflow Node in this Loop Stage is already current. Your current Working Draft was kept.";
    default:
      return error.detail;
  }
}

export function LoopSessionWorkbench({ sessionId }: { sessionId: string }) {
  return (
    <LoopSessionSaveProvider>
      <LoopSessionWorkbenchView sessionId={sessionId} />
    </LoopSessionSaveProvider>
  );
}

function LoopSessionWorkbenchView({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { queue } = useLoopSessionSave();
  const sessionQuery = useGetSessionApiLoopSessionsSessionIdGet(sessionId);
  const prepareMutation = useRecomputePrepareApiLoopSessionsSessionIdRecomputePreparePost();
  const patchWorkingDraft = usePatchWorkingDraftApiLoopSessionsSessionIdWorkingDraftPatch();
  const [appliedSession, setAppliedSession] = useState<LoopSessionResponse | null>(null);
  const [transitionError, setTransitionError] = useState<OperationalError | null>(null);

  const queriedSession = sessionQuery.data?.status === 200 ? sessionQuery.data.data : null;
  const session = newerSession(queriedSession, appliedSession);
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
  const actions = deriveStageActions({
    stage: selectedStage,
    nodeHeads: session.node_heads,
  });
  const sessionKey = getGetSessionApiLoopSessionsSessionIdGetQueryKey(sessionId);

  function expectedVersion(): number {
    const cached = queryClient.getQueryData(sessionKey) as
      | { status: number; data: LoopSessionResponse }
      | undefined;
    if (cached?.status === 200) {
      return cached.data.version;
    }
    return session?.version ?? 1;
  }

  async function applyTransition(
    mutate: (expectedVersion: number) => Promise<{ status: number; data: unknown }>,
  ) {
    await queue.flush();
    try {
      const response = await queue.enqueue(() => mutate(expectedVersion()));
      if (response.status === 200) {
        queryClient.setQueryData(sessionKey, response);
        setAppliedSession(response.data as LoopSessionResponse);
        setTransitionError(null);
      }
    } catch (error) {
      const typed = operationalError(error);
      setTransitionError(typed ?? { code: "", detail: getApiErrorMessage(error) });
    }
  }

  function startOrRecompute() {
    if (!selectedStage) return;
    const stage = selectedStage;
    void applyTransition((version) =>
      prepareMutation.mutateAsync({
        sessionId,
        data: { stage, expected_version: version },
      }),
    );
  }

  function editConfirmedWork(node: WorkflowNode) {
    void applyTransition((version) =>
      patchWorkingDraft.mutateAsync({
        sessionId,
        data: { node, expected_version: version },
      }),
    );
  }

  return (
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
          <>
            <WorkingDraftNarrativeEditor sessionId={sessionId} />
            <WorkingDraftCardCanvas sessionId={sessionId} />
          </>
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
              {actions.canStart || actions.canRecompute || actions.editableNodes.length > 0 ? (
                <div className="grid gap-3">
                  {actions.canStart ? (
                    <Button onClick={startOrRecompute}>Start</Button>
                  ) : null}
                  {actions.canRecompute ? (
                    <Button onClick={startOrRecompute}>Recompute</Button>
                  ) : null}
                  {actions.editableNodes.length > 0 ? (
                    <div className="grid gap-2">
                      <p className="text-sm font-medium">Edit confirmed work</p>
                      <div className="flex flex-wrap gap-2">
                        {actions.editableNodes.map((node) => (
                          <Button
                            key={node}
                            variant="outline"
                            onClick={() => editConfirmedWork(node)}
                          >
                            Edit {WORKFLOW_NODE_LABELS[node]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}
              {transitionError ? (
                <div role="alert" className="rounded-md border border-pending bg-card p-3">
                  <p className="text-sm">{transitionMessage(transitionError)}</p>
                  {transitionError.code === "version_conflict" ? (
                    <Button
                      className="mt-3"
                      variant="outline"
                      onClick={() => {
                        void sessionQuery.refetch().then((refreshed) => {
                          if (refreshed.data?.status === 200) {
                            queryClient.setQueryData(sessionKey, refreshed.data);
                            setAppliedSession(refreshed.data.data);
                            setTransitionError(null);
                          }
                        });
                      }}
                    >
                      Load current Loop Session
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
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
