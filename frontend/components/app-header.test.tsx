import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppHeader } from "./app-header";

vi.mock("next/navigation", () => ({
  usePathname: () => "/sessions",
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/features/identity", () => ({
  useAccount: () => ({
    ready: true,
    signedIn: true,
    email: "ada@example.com",
    isLoading: false,
    signOut: vi.fn(),
  }),
}));

describe("AppHeader", () => {
  it("points the product Loop Session link at Loop Sessions, not the demo route", () => {
    render(<AppHeader />);
    const productLink = screen.getByRole("link", { name: "Loop Sessions" });
    expect(productLink).toHaveAttribute("href", "/sessions");
    expect(screen.queryByRole("link", { name: "Loop Session" })).not.toBeInTheDocument();
  });
});
