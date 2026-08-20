import { describe, expect, it } from "vitest";
import { getSecretPresentation } from "./adminSecurity";

describe("admin integration secret presentation", () => {
  it("never returns the configured secret to be rendered in the browser", () => {
    expect(getSecretPresentation("sk-live-sensitive-value")).toEqual({
      label: "Configured securely",
      value: "",
      type: "password",
    });
  });

  it("shows an unconfigured state without exposing a placeholder secret", () => {
    expect(getSecretPresentation(undefined)).toEqual({
      label: "Not configured",
      value: "",
      type: "password",
    });
  });
});
