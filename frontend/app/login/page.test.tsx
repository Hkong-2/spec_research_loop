import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import LoginPage from "./page";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () =>
    new URLSearchParams({ returnTo: "/sessions/abc?stage=grilling" }),
}));

vi.mock("@/features/identity", () => ({
  AuthForm: ({ onSuccess }: { onSuccess: () => void }) => (
    <button onClick={onSuccess}>Complete sign in</button>
  ),
}));

describe("LoginPage", () => {
  it("resumes a validated local destination after authentication", async () => {
    render(<LoginPage />);

    await userEvent.click(screen.getByRole("button", { name: "Complete sign in" }));

    expect(replace).toHaveBeenCalledWith("/sessions/abc?stage=grilling");
  });
});
