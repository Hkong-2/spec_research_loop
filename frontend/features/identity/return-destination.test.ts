import { describe, expect, it } from "vitest";

import { safeReturnDestination } from "@/lib/auth-return";

describe("safeReturnDestination", () => {
  it("preserves local Loop Session destinations", () => {
    expect(safeReturnDestination("/sessions/abc?stage=grilling")).toBe(
      "/sessions/abc?stage=grilling",
    );
  });

  it.each([
    [null],
    ["https://example.com"],
    ["//example.com/sessions"],
    ["/\\example.com/sessions"],
    ["sessions/abc"],
  ])("falls back for unsafe destinations: %s", (value) => {
    expect(safeReturnDestination(value)).toBe("/sessions");
  });
});
