import { LoopStage, NodeHeadStatus, WorkflowNode } from "@/lib/api/generated/model";
import type { NodeHeadResponse } from "@/lib/api/generated/model";

import { catalogStage, stageForWorkflowNode, upstreamOfStage } from "./catalog";

export type CompletionSignal = "complete" | "needs_work" | "stale" | "not_evaluated";

export type StageSignals = {
  completion: CompletionSignal;
  editing: boolean;
  available: boolean;
};

export function incompleteUpstreamNodes({
  stage,
  nodeHeads,
}: {
  stage: LoopStage;
  nodeHeads: NodeHeadResponse[];
}): WorkflowNode[] {
  const statusByNode = new Map(nodeHeads.map((head) => [head.node, head.status]));
  return [...upstreamOfStage(stage)].filter(
    (node) => statusByNode.get(node) !== NodeHeadStatus.current,
  );
}

export type StageActions = {
  canStart: boolean;
  canRecompute: boolean;
  editableNodes: WorkflowNode[];
};

export function deriveStageActions({
  stage,
  nodeHeads,
}: {
  stage: LoopStage;
  nodeHeads: NodeHeadResponse[];
}): StageActions {
  const nodes = catalogStage(stage).nodes;
  if (nodes.length === 0 || incompleteUpstreamNodes({ stage, nodeHeads }).length > 0) {
    return { canStart: false, canRecompute: false, editableNodes: [] };
  }
  const statusByNode = new Map(nodeHeads.map((head) => [head.node, head.status]));
  const statuses = nodes.map((node) => statusByNode.get(node) ?? NodeHeadStatus.empty);
  const hasEmpty = statuses.includes(NodeHeadStatus.empty);
  const hasStale = statuses.includes(NodeHeadStatus.stale);
  return {
    canStart: hasEmpty && !hasStale,
    canRecompute: hasStale,
    editableNodes: nodes.filter((node) => statusByNode.get(node) === NodeHeadStatus.current),
  };
}

export function deriveStageSignals({
  stage,
  nodeHeads,
  workingDraftNode,
}: {
  stage: LoopStage;
  nodeHeads: NodeHeadResponse[];
  workingDraftNode: WorkflowNode;
}): StageSignals {
  const statusByNode = new Map(nodeHeads.map((head) => [head.node, head.status]));
  const nodes = catalogStage(stage).nodes;
  const editing = stageForWorkflowNode(workingDraftNode) === stage;
  const incompleteUpstream = incompleteUpstreamNodes({ stage, nodeHeads });
  const available = incompleteUpstream.length === 0;

  if (nodes.length === 0) {
    return { completion: "not_evaluated", editing: false, available };
  }

  const statuses = nodes.map((node) => statusByNode.get(node) ?? NodeHeadStatus.empty);
  if (statuses.includes(NodeHeadStatus.stale)) {
    return { completion: "stale", editing, available };
  }
  if (statuses.every((status) => status === NodeHeadStatus.current)) {
    return { completion: "complete", editing, available };
  }
  return { completion: "needs_work", editing, available };
}
