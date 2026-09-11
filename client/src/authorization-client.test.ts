import { describe, expect, it } from "vitest";
import { createAuthorizationState } from "@/lib/authorization";

describe("Owner and Client authorization contract", () => {
  it("keeps the existing user role as a restricted Client without granting management rights", () => {
    const state = createAuthorizationState(
      {
        id: "profile-client",
        user_id: "user-client",
        display_name: "Client",
        role: "user",
        status: "active",
      },
      { can_view_dossier: true },
      new Set(["case-1"]),
    );

    expect(state.isClient).toBe(true);
    expect(state.isGuestReviewer).toBe(true);
    expect(state.isOwner).toBe(false);
    expect(state.isAdmin).toBe(false);
    expect(state.can("can_view_dossier")).toBe(true);
    expect(state.canViewResource("case", "case-1")).toBe(true);
    expect(state.canViewResource("case", "case-2")).toBe(false);
  });
});
