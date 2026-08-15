import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api/config";
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
const prepareHook = vi.fn();
const patchHook = vi.fn();
const setQueryData = vi.fn();
const getQueryData = vi.fn();
let search = new URLSearchParams();

vi.mock("next/navigation", () => ({
  usePathname: () => "/sessions/session-1",
  useRouter: () => ({ replace, push: vi.fn() }),
  useSearchParams: () => search,
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQueryClient: () => ({ setQueryData, getQueryData }),
  };
});

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
  getGetSessionApiLoopSessionsSessionIdGetQueryKey: (id: string) => [`/sessions/${id}`],
  useGetSessionApiLoopSessionsSessionIdGet: (...args: unknown[]) => getHook(...args),
  useRecomputePrepareApiLoopSessionsSessionIdRecomputePreparePost: (...args: unknown[]) =>
    prepareHook(...args),
  usePatchWorkingDraftApiLoopSessionsSessionIdWorkingDraftPatch: (...args: unknown[]) =>
    patchHook(...args),
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
    prepareHook.mockReset();
    patchHook.mockReset();
    setQueryData.mockReset();
    getQueryData.mockReset();
    search = new URLSearchParams();
    getHook.mockReturnValue({
      data: { status: 200, data: session() },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    prepareHook.mockReturnValue({ mutateAsync: vi.fn(), error: null });
    patchHook.mockReturnValue({ mutateAsync: vi.fn(), error: null });
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

  it("selects a Loop Stage only through the query string and issues no mutations", async () => {
    const prepare = vi.fn();
    const patch = vi.fn();
    prepareHook.mockReturnValue({ mutateAsync: prepare, error: null });
    patchHook.mockReturnValue({ mutateAsync: patch, error: null });
    render(<LoopSessionWorkbench sessionId="session-1" />);
    const contribution = screen.getByRole("link", { name: /Contribution/ });

    expect(contribution).toHaveAttribute("href", "/sessions/session-1?stage=contribution");
    await userEvent.click(contribution);
    expect(prepare).not.toHaveBeenCalled();
    expect(patch).not.toHaveBeenCalled();
  });

  it("offers Start on an empty available Loop Stage", () => {
    search = new URLSearchParams(`stage=${LoopStage.grilling}`);
    render(<LoopSessionWorkbench sessionId="session-1" />);
    const overview = screen.getByRole("region", { name: "Grilling overview" });

    expect(within(overview).getByRole("button", { name: "Start" })).toBeInTheDocument();
    expect(within(overview).queryByRole("button", { name: "Recompute" })).not.toBeInTheDocument();
    expect(within(overview).queryByRole("button", { name: /Edit / })).not.toBeInTheDocument();
  });

  it("offers Recompute and Edit confirmed work from Node Heads", () => {
    search = new URLSearchParams(`stage=${LoopStage.grilling}`);
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          working_draft_node: WorkflowNode.idea_decomposition,
          node_heads: heads({
            [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
            [WorkflowNode.idea_decomposition]: NodeHeadStatus.stale,
          }),
        }),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    const overview = screen.getByRole("region", { name: "Grilling overview" });

    expect(within(overview).queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
    expect(within(overview).getByRole("button", { name: "Recompute" })).toBeInTheDocument();
    expect(within(overview).getByRole("button", { name: "Edit Idea interpretation" })).toBeInTheDocument();
  });

  it("offers Edit confirmed work when every Workflow Node is current", () => {
    search = new URLSearchParams(`stage=${LoopStage.grilling}`);
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          working_draft_node: WorkflowNode.research_inputs,
          node_heads: heads({
            [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
            [WorkflowNode.idea_decomposition]: NodeHeadStatus.current,
          }),
        }),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    const overview = screen.getByRole("region", { name: "Grilling overview" });

    expect(within(overview).queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
    expect(within(overview).queryByRole("button", { name: "Recompute" })).not.toBeInTheDocument();
    expect(within(overview).getByRole("button", { name: "Edit Idea interpretation" })).toBeInTheDocument();
    expect(within(overview).getByRole("button", { name: "Edit Idea decomposition" })).toBeInTheDocument();
  });

  it("does not offer Start, Recompute, or Edit on an unavailable Loop Stage", () => {
    search = new URLSearchParams(`stage=${LoopStage.related_work}`);
    render(<LoopSessionWorkbench sessionId="session-1" />);
    const overview = screen.getByRole("region", { name: "Related work overview" });

    expect(within(overview).queryByRole("button", { name: "Start" })).not.toBeInTheDocument();
    expect(within(overview).queryByRole("button", { name: "Recompute" })).not.toBeInTheDocument();
    expect(within(overview).queryByRole("button", { name: /Edit / })).not.toBeInTheDocument();
  });

  it("starts empty work through recompute-prepare and applies the server Loop Session", async () => {
    search = new URLSearchParams(`stage=${LoopStage.related_work}`);
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          version: 4,
          working_draft_node: WorkflowNode.idea_decomposition,
          node_heads: heads({
            [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
            [WorkflowNode.idea_decomposition]: NodeHeadStatus.current,
          }),
        }),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const prepared = session({
      version: 5,
      working_draft_node: WorkflowNode.research_inputs,
      working_draft_narrative: { text: "from snapshot" },
      node_heads: heads({
        [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
        [WorkflowNode.idea_decomposition]: NodeHeadStatus.current,
        [WorkflowNode.research_inputs]: NodeHeadStatus.empty,
      }),
    });
    const mutateAsync = vi.fn().mockResolvedValue({ status: 200, data: prepared });
    prepareHook.mockReturnValue({ mutateAsync, error: null });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    const overview = screen.getByRole("region", { name: "Related work overview" });
    expect(screen.queryByText(/Working Draft narrative editor/)).not.toBeInTheDocument();
    await userEvent.click(within(overview).getByRole("button", { name: "Start" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      sessionId: "session-1",
      data: { stage: LoopStage.related_work, expected_version: 4 },
    });
    expect(setQueryData).toHaveBeenCalledWith(["/sessions/session-1"], {
      status: 200,
      data: prepared,
    });
    expect(screen.getByText("Working Draft: Research inputs")).toBeInTheDocument();
    expect(screen.getByText("Working Draft narrative editor for session-1")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Loop Stages" });
    expect(within(nav).getByRole("link", { name: /Related work/ })).toHaveTextContent("Editing");
  });

  it("recomputes stale work through recompute-prepare with the current aggregate version", async () => {
    search = new URLSearchParams(`stage=${LoopStage.grilling}`);
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          version: 3,
          working_draft_node: WorkflowNode.idea_interpretation,
          node_heads: heads({
            [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
            [WorkflowNode.idea_decomposition]: NodeHeadStatus.stale,
          }),
        }),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const mutateAsync = vi.fn().mockResolvedValue({
      status: 200,
      data: session({
        version: 4,
        working_draft_node: WorkflowNode.idea_decomposition,
        node_heads: heads({
          [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
          [WorkflowNode.idea_decomposition]: NodeHeadStatus.stale,
        }),
      }),
    });
    prepareHook.mockReturnValue({ mutateAsync, error: null });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Recompute" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      sessionId: "session-1",
      data: { stage: LoopStage.grilling, expected_version: 3 },
    });
    expect(screen.getByText("Working Draft: Idea decomposition")).toBeInTheDocument();
  });

  it("reopens a chosen current Workflow Node through the Working Draft mutation", async () => {
    search = new URLSearchParams(`stage=${LoopStage.grilling}`);
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          version: 6,
          working_draft_node: WorkflowNode.research_inputs,
          node_heads: heads({
            [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
            [WorkflowNode.idea_decomposition]: NodeHeadStatus.current,
          }),
        }),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const reopened = session({
      version: 7,
      working_draft_node: WorkflowNode.idea_interpretation,
      working_draft_narrative: { text: "kept interpretation" },
      node_heads: heads({
        [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
        [WorkflowNode.idea_decomposition]: NodeHeadStatus.current,
      }),
    });
    const mutateAsync = vi.fn().mockResolvedValue({ status: 200, data: reopened });
    patchHook.mockReturnValue({ mutateAsync, error: null });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    expect(screen.queryByText(/Working Draft narrative editor/)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Edit Idea interpretation" }));

    expect(mutateAsync).toHaveBeenCalledWith({
      sessionId: "session-1",
      data: {
        expected_version: 6,
        node: WorkflowNode.idea_interpretation,
      },
    });
    expect(screen.getByText("Working Draft: Idea interpretation")).toBeInTheDocument();
    expect(screen.getByText("Working Draft narrative editor for session-1")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Loop Stages" })).toHaveTextContent("Editing");
  });

  it("preserves local Loop Session state and recovers from a version conflict", async () => {
    search = new URLSearchParams(`stage=${LoopStage.grilling}`);
    const refetch = vi.fn().mockResolvedValue({
      data: {
        status: 200,
        data: session({
          version: 2,
          title: "Server title",
          working_draft_node: WorkflowNode.idea_interpretation,
          working_draft_narrative: { text: "Server idea" },
        }),
      },
    });
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          version: 1,
          working_draft_narrative: { text: "Local idea" },
        }),
      },
      isLoading: false,
      isError: false,
      refetch,
    });
    const mutateAsync = vi.fn().mockRejectedValue(
      new ApiError(409, "changed", {
        code: "version_conflict",
        detail: "Loop Session was changed by another request",
        current_version: 2,
      }),
    );
    prepareHook.mockReturnValue({ mutateAsync, error: null });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("version conflict");
    expect(screen.getByText("Working Draft: Idea interpretation")).toBeInTheDocument();
    expect(screen.getByText("Working Draft narrative editor for session-1")).toBeInTheDocument();
    expect(setQueryData).not.toHaveBeenCalled();
    expect(mutateAsync).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: "Load current Loop Session" }));
    expect(refetch).toHaveBeenCalled();
    expect(setQueryData).toHaveBeenCalledWith(["/sessions/session-1"], {
      status: 200,
      data: session({
        version: 2,
        title: "Server title",
        working_draft_node: WorkflowNode.idea_interpretation,
        working_draft_narrative: { text: "Server idea" },
      }),
    });
  });

  it("explains incomplete upstream work without changing local edits", async () => {
    search = new URLSearchParams(`stage=${LoopStage.related_work}`);
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          version: 2,
          working_draft_node: WorkflowNode.idea_decomposition,
          node_heads: heads({
            [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
            [WorkflowNode.idea_decomposition]: NodeHeadStatus.current,
          }),
        }),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const mutateAsync = vi.fn().mockRejectedValue(
      new ApiError(409, "upstream", {
        code: "upstream_not_current",
        detail: "Upstream Node Heads of this Loop Stage must be current",
      }),
    );
    prepareHook.mockReturnValue({ mutateAsync, error: null });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("not current");
    expect(screen.getByText("Working Draft: Idea decomposition")).toBeInTheDocument();
    expect(setQueryData).not.toHaveBeenCalled();
  });

  it("explains an already-current Loop Stage without changing local edits", async () => {
    search = new URLSearchParams(`stage=${LoopStage.grilling}`);
    getHook.mockReturnValue({
      data: {
        status: 200,
        data: session({
          version: 2,
          working_draft_node: WorkflowNode.idea_decomposition,
          node_heads: heads({
            [WorkflowNode.idea_interpretation]: NodeHeadStatus.current,
            [WorkflowNode.idea_decomposition]: NodeHeadStatus.empty,
          }),
        }),
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    const mutateAsync = vi.fn().mockRejectedValue(
      new ApiError(409, "current", {
        code: "stage_already_current",
        detail: "Every Workflow Node in this Loop Stage is current",
      }),
    );
    prepareHook.mockReturnValue({ mutateAsync, error: null });

    render(<LoopSessionWorkbench sessionId="session-1" />);
    await userEvent.click(screen.getByRole("button", { name: "Start" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("already current");
    expect(screen.getByText("Working Draft: Idea decomposition")).toBeInTheDocument();
    expect(setQueryData).not.toHaveBeenCalled();
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
