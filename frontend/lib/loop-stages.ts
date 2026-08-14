export const LOOP_STAGES = [
  {
    id: "grilling",
    name: "Grilling",
    description: "Clarify the research idea through questions you confirm.",
  },
  {
    id: "related-work",
    name: "Related work",
    description: "Locate and assess prior work against the idea.",
  },
  {
    id: "claims",
    name: "Claims/evidence",
    description: "State claims and the evidence that would support them.",
  },
  {
    id: "experiments",
    name: "Experiment planning",
    description: "Plan tests that could confirm or refute the claims.",
  },
  {
    id: "judges",
    name: "Independent judges",
    description: "Separate judgement of the draft Research Spec.",
  },
  {
    id: "readiness",
    name: "Readiness",
    description: "Evaluate readiness criteria. Not conference acceptance.",
  },
] as const;

export type LoopStageId = (typeof LOOP_STAGES)[number]["id"];
export type StageStatus = "pending" | "in-review" | "confirmed" | "blocked";

export const STAGE_STATUS_LABEL: Record<StageStatus, string> = {
  pending: "Pending",
  "in-review": "In review",
  confirmed: "Confirmed",
  blocked: "Blocked",
};

export function stageIndex(id: LoopStageId): number {
  return LOOP_STAGES.findIndex((stage) => stage.id === id) + 1;
}
