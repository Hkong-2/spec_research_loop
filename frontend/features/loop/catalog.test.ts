import { describe, expect, it } from "vitest";

import { CardKind, LoopStage, WorkflowNode } from "@/lib/api/generated/model";

import {
  LOOP_STAGE_CATALOG,
  ancestors,
  ownedCardKinds,
  resolveSelectedStage,
  stageForWorkflowNode,
  upstreamOfStage,
} from "./catalog";

describe("Loop Stage catalog", () => {
  it("covers every generated Loop Stage in domain order, including Contribution", () => {
    expect(LOOP_STAGE_CATALOG.map((stage) => stage.id)).toEqual(Object.values(LoopStage));
    expect(LOOP_STAGE_CATALOG.map((stage) => stage.name)).toEqual([
      "Grilling",
      "Related work",
      "Contribution",
      "Claims/evidence",
      "Experiment planning",
      "Independent judges",
      "Readiness",
    ]);
  });

  it("groups every generated Workflow Node without a second identifier vocabulary", () => {
    const grouped = LOOP_STAGE_CATALOG.flatMap((stage) => [...stage.nodes]);
    expect(grouped).toEqual(Object.values(WorkflowNode));
    expect(LOOP_STAGE_CATALOG.find((stage) => stage.id === LoopStage.readiness)?.nodes).toEqual([]);
  });

  it("maps a Working Draft Workflow Node to its Loop Stage", () => {
    expect(stageForWorkflowNode(WorkflowNode.idea_interpretation)).toBe(LoopStage.grilling);
    expect(stageForWorkflowNode(WorkflowNode.idea_decomposition)).toBe(LoopStage.grilling);
    expect(stageForWorkflowNode(WorkflowNode.contribution)).toBe(LoopStage.contribution);
    expect(stageForWorkflowNode(WorkflowNode.aggregator)).toBe(LoopStage.independent_judges);
  });

  it("falls back to the Working Draft Loop Stage when the query is absent or invalid", () => {
    expect(resolveSelectedStage(null, WorkflowNode.idea_decomposition)).toBe(LoopStage.grilling);
    expect(resolveSelectedStage("not-a-stage", WorkflowNode.contribution)).toBe(
      LoopStage.contribution,
    );
    expect(resolveSelectedStage(LoopStage.related_work, WorkflowNode.idea_interpretation)).toBe(
      LoopStage.related_work,
    );
  });

  it("derives Contribution upstream from generated Workflow Node edges", () => {
    expect(ancestors(WorkflowNode.contribution)).toEqual(
      new Set([
        WorkflowNode.gap,
        WorkflowNode.related_work,
        WorkflowNode.research_inputs,
        WorkflowNode.idea_decomposition,
        WorkflowNode.idea_interpretation,
      ]),
    );
    expect(upstreamOfStage(LoopStage.grilling)).toEqual(new Set());
    expect(upstreamOfStage(LoopStage.related_work)).toEqual(
      new Set([WorkflowNode.idea_interpretation, WorkflowNode.idea_decomposition]),
    );
  });

  it("maps every generated Card kind to one confirming Workflow Node", () => {
    expect(ownedCardKinds(WorkflowNode.idea_interpretation)).toEqual([]);
    expect(ownedCardKinds(WorkflowNode.idea_decomposition)).toEqual([
      CardKind.problem,
      CardKind.research_question,
      CardKind.constraint,
      CardKind.open_question,
    ]);
    expect(ownedCardKinds(WorkflowNode.gap)).toEqual([CardKind.gap]);
    expect(ownedCardKinds(WorkflowNode.contribution)).toEqual([CardKind.contribution]);
    expect(ownedCardKinds(WorkflowNode.claims)).toEqual([CardKind.claim]);
    expect(ownedCardKinds(WorkflowNode.evidence)).toEqual([CardKind.evidence]);
    expect(ownedCardKinds(WorkflowNode.experiment_plan)).toEqual([]);
  });
});
