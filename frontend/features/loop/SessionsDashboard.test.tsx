import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SessionsDashboard } from "./SessionsDashboard";

const push = vi.fn();
const replace = vi.fn();
const listHook = vi.fn();
const createHook = vi.fn();
const accountHook = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/sessions",
  useRouter: () => ({ push, replace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/features/identity", () => ({
  useAccount: () => accountHook(),
}));

vi.mock("@/lib/api/generated/endpoints", () => ({
  useListSessionsApiLoopSessionsGet: (...args: unknown[]) => listHook(...args),
  useCreateSessionApiLoopSessionsPost: (...args: unknown[]) => createHook(...args),
}));

describe("SessionsDashboard", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    listHook.mockReset();
    createHook.mockReset();
    accountHook.mockReset();
    accountHook.mockReturnValue({
      ready: true,
      signedIn: true,
      hasToken: true,
      isLoading: false,
    });
    createHook.mockReturnValue({ isPending: false, error: null, mutate: vi.fn() });
  });

  it("redirects signed-out visitors with a safe local return destination", () => {
    accountHook.mockReturnValue({
      ready: true,
      signedIn: false,
      hasToken: false,
      isLoading: false,
    });
    listHook.mockReturnValue({ isLoading: false, isError: false });

    render(<SessionsDashboard />);

    expect(replace).toHaveBeenCalledWith("/login?returnTo=%2Fsessions");
  });

  it("shows loading, empty, and failure states", () => {
    listHook.mockReturnValueOnce({ isLoading: true, isError: false });
    const { rerender } = render(<SessionsDashboard />);
    expect(screen.getByText("Loading Loop Sessions…")).toBeInTheDocument();

    listHook.mockReturnValueOnce({
      data: { status: 200, data: [] },
      isLoading: false,
      isError: false,
    });
    rerender(<SessionsDashboard />);
    expect(screen.getByText("No Loop Sessions yet")).toBeInTheDocument();

    listHook.mockReturnValueOnce({ isLoading: false, isError: true, refetch: vi.fn() });
    rerender(<SessionsDashboard />);
    expect(screen.getByRole("alert")).toHaveTextContent("could not load");
  });

  it("uses the untitled fallback and opens a Loop Session", () => {
    listHook.mockReturnValue({
      data: {
        status: 200,
        data: [
          {
            id: "session-1",
            title: null,
            version: 1,
            working_draft_node: "idea_interpretation",
            created_at: "2026-08-15T10:00:00Z",
            updated_at: "2026-08-16T10:00:00Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
    });

    render(<SessionsDashboard />);

    expect(screen.getByRole("link", { name: /Untitled Loop Session/ })).toHaveAttribute(
      "href",
      "/sessions/session-1",
    );
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it("creates a Loop Session and navigates to it", async () => {
    listHook.mockReturnValue({
      data: { status: 200, data: [] },
      isLoading: false,
      isError: false,
    });
    createHook.mockImplementation((options) => ({
      isPending: false,
      error: null,
      mutate: () =>
        options.mutation.onSuccess({
          status: 201,
          data: { id: "new-session" },
        }),
    }));

    render(<SessionsDashboard />);
    await userEvent.click(screen.getByRole("button", { name: "Create Loop Session" }));

    expect(push).toHaveBeenCalledWith("/sessions/new-session");
  });
});
