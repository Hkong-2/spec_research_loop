import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  CardKind,
  LoopStage,
  NodeHeadStatus,
  WorkflowNode,
  type LoopSessionResponse,
} from "@/lib/api/generated/model";

import { LoopSessionWorkbench } from "./LoopSessionWorkbench";

const replace = vi.fn();
const getHook = vi.fn();
let search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/sessions/session-1",
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => search,
}));

vi.mock("./LoopSessionTitleEditor", () => ({
  LoopSessionTitleEditor: ({ sessionId }: { sessionId: string }) => (
    <p>Title editor for {sessionId}</p>
  ),
}));

vi.mock("./WorkingDraftNarrativeEditor", () => ({
  WorkingDraftNarrativeEditor: ({ sessionId }: { sessionId: string }) => (
    <p>Working Draft narrative editor for {sessionId}</p>
  ),
}));

vi.mock("./WorkingDraftCardCanvas", () => ({
  WorkingDraftCardCanvas: ({ sessionId }: { sessionId: string }) => (
    <p>Working Draft Card canvas for {sessionId}</p>
  ),
}));

vi.mock("@/lib/api/generated/endpoints", () => ({
  useGetSessionApiLoopSessionsSessionIdGet: (...args: unknown[]) => getHook(...args),
}));

function heads(
  overrides: Partial<Record<WorkflowNode, NodeHeadStatus>> = {},
): LoopSessionResponse["node_heads"] {
  return Object.values(WorkflowNode).map((node) => ({
    node,
    status: overrides[node] ?? NodeHeadStatus.empty,
    stage_revision_id: null,
  }));
}

function session(overrides: Partial<LoopSessionResponse> = {}): LoopSessionResponse {
  return {
    id: "session-1",
    title: "GPU kernels",
    version: 1,
    working_draft_node: WorkflowNode.idea_interpretation,
    working_draft_narrative: {},
    node_heads: heads(),
    cards: [],
    produced_spec_version: null,
    valid_spec_version_id: null,
    created_at: "2026-08-15T10:00:00Z",
    updated_at: "2026-08-16T10:00:00Z",
    ...overrides,
  };
}

describe("LoopSessionWorkbench", () => {
  beforeEach(() => {
    replace.mockReset();
    getHook.mockReset();
    search = new URLSearchParams();
    getHook.mockReturnValue({
      data: { status: 200, data: session() },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
  });

  it("loads Working Draft, Node Heads, Cards, and Spec Version pointers through the generated client", () => {
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          cards: [
            {
              id: "card-1",
              kind: CardKind.problem,
              body: { text: "Memory bandwidth" },
              created_at: "2026-08-15T10:00:00Z",
              updated_at: "2026-08-15T10:00:00Z",
            },
          ],
          produced_spec_version: {
            id: "spec-1",
            document: {},
            created_at: "2026-08-16T10:00:00Z",
          },
          valid_spec_version_id: null,
        }),
      },
      isLoading: false,
      isError: false,
    });

    render(<LoopSessionWorkbench sessionId="session-1" />);

    expect(getHook).toHaveBeenCalledWith("session-1");
    expect(screen.getByText("Title editor for session-1")).toBeInTheDocument();
    expect(screen.getByText("Working Draft: Idea interpretation")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Loop Stages" })).toBeInTheDocument();
  });

  it("shows all seven canonical Loop Stages in order, including Contribution", () => {
    render(<LoopSessionWorkbench sessionId="session-1" />);
    const nav = screen.getByRole("navigation", { name: "Loop Stages" });

    expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual([
      expect.stringContaining("Grilling"),
      expect.stringContaining("Related work"),
      expect.stringContaining("Contribution"),
      expect.stringContaining("Claims/evidence"),
      expect.stringContaining("Experiment planning"),
      expect.stringContaining("Independent judges"),
      expect.stringContaining("Readiness"),
    ]);
  });

  it("shows completion, Editing, and availability as independent signals", () => {
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          working_draft_node: WorkflowNode.idea_interpretation,
          node_heads: heads({
            [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
            [WorkflowNode.idea_decomposition]: NodeHeadStatus.current,
          }),
        }),
      },
      isLoading: false,
      isError: false,
    });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    const nav = screen.getByRole("navigation", { name: "Loop Stages" });
    const grilling = within(nav).getByRole("link", { name: /Grilling/ });
    const relatedWork = within(nav).getByRole("link", { name: /Related work/ });
    const contribution = within(nav).getByRole("link", { name: /Contribution/ });

    expect(grilling).toHaveTextContent("Complete");
    expect(grilling).toHaveTextContent("Editing");
    expect(relatedWork).toHaveTextContent("Needs work");
    expect(relatedWork).not.toHaveTextContent("Unavailable");
    expect(relatedWork).not.toHaveTextContent("Editing");
    expect(contribution).toHaveTextContent("Unavailable");
    expect(contribution).not.toHaveTextContent("Editing");
  });

  it("selects a Loop Stage only through the query string and issues no mutations", () => {
    render(<LoopSessionWorkbench sessionId="session-1" />);
    const contribution = screen.getByRole("link", { name: /Contribution/ });

    expect(contribution).toHaveAttribute("href", "/sessions/session-1?stage=contribution");
    expect(screen.queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Recompute" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continue" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("falls back from an absent or invalid stage query to the Working Draft Loop Stage", () => {
    search = new URLSearchParams("stage=not-a-stage");
    render(<LoopSessionWorkbench sessionId="session-1" />);

    expect(replace).toHaveBeenCalledWith("/sessions/session-1?stage=grilling", { scroll: false });
  });

  it("lists Workflow Nodes and Node Head states for the selected Loop Stage", () => {
    search = new URLSearchParams(`stage=${LoopStage.grilling}`);
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          node_heads: heads({
            [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
            [WorkflowNode.idea_decomposition]: NodeHeadStatus.empty,
          }),
        }),
      },
      isLoading: false,
      isError: false,
    });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    const overview = screen.getByRole("region", { name: "Grilling overview" });

    expect(within(overview).getByText("Idea interpretation")).toBeInTheDocument();
    expect(within(overview).getByText(/Node Head: Current/)).toBeInTheDocument();
    expect(within(overview).getByText("Idea decomposition")).toBeInTheDocument();
    expect(within(overview).getByText(/Node Head: Empty/)).toBeInTheDocument();
  });

  it("explains unavailable stages from incomplete upstream Node Heads", () => {
    search = new URLSearchParams(`stage=${LoopStage.related_work}`);
    render(<LoopSessionWorkbench sessionId="session-1" />);
    const overview = screen.getByRole("region", { name: "Related work overview" });

    expect(overview).toHaveTextContent("Unavailable");
    expect(overview).toHaveTextContent("Idea interpretation");
    expect(overview).toHaveTextContent("Idea decomposition");
  });

  it("shows Readiness as Not evaluated with no percentage", () => {
    search = new URLSearchParams(`stage=${LoopStage.readiness}`);
    render(<LoopSessionWorkbench sessionId="session-1" />);
    const overview = screen.getByRole("region", { name: "Readiness overview" });

    expect(overview).toHaveTextContent("Not evaluated");
    expect(overview).not.toHaveTextContent("%");
    expect(screen.queryByRole("img", { name: /readiness criteria met/i })).not.toBeInTheDocument();
  });

  it("shows loading and failure states", () => {
    getHook.mockReturnValueOnce({ isLoading: true, isError: false });
    const { rerender } = render(<LoopSessionWorkbench sessionId="session-1" />);
    expect(screen.getByText("Loading Loop Session…")).toBeInTheDocument();

    getHook.mockReturnValueOnce({ isLoading: false, isError: true, refetch: vi.fn() });
    rerender(<LoopSessionWorkbench sessionId="session-1" />);
    expect(screen.getByRole("alert")).toHaveTextContent("could not load");
  });

  it("lets the Account enter the research idea in the interpretation Working Draft", () => {
    search = new URLSearchParams(`stage=${LoopStage.grilling}`);
    render(<LoopSessionWorkbench sessionId="session-1" />);
    expect(screen.getByText("Working Draft narrative editor for session-1")).toBeInTheDocument();
    expect(screen.getByText("Working Draft Card canvas for session-1")).toBeInTheDocument();
  });

  it("does not open the Working Draft editor merely by selecting another Loop Stage", () => {
    search = new URLSearchParams(`stage=${LoopStage.related_work}`);
    render(<LoopSessionWorkbench sessionId="session-1" />);
    expect(screen.queryByText(/Working Draft narrative editor/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Working Draft Card canvas/)).not.toBeInTheDocument();
  });
});
