import { describe, expect, it } from "vitest";
import { canRouteModel, isVerifiedFreeModel } from "../../functions/_shared/ai-cost-policy";

describe("free-model eligibility fails closed", () => {
  it("accepts explicit free variants with zero catalog prices", () => {
    expect(isVerifiedFreeModel("openrouter", "example/model:free", { prompt: "0", completion: 0, request: "0" })).toBe(true);
  });
  it.each([undefined, null, {}, { prompt: "0" }, { completion: "0" }, { prompt: null, completion: "0" }, { prompt: "", completion: "0" }, { prompt: " ", completion: "0" }, { prompt: false, completion: "0" }, { prompt: "unknown", completion: "0" }, { prompt: "-1", completion: "0" }, { prompt: "0.01", completion: "0" }, { prompt: "0", completion: "0", request: "0.001" }, { prompt: "0", completion: "0", image: "0.01" }])("rejects unknown or nonzero pricing %j", pricing => {
    expect(isVerifiedFreeModel("openrouter", "example/model:free", pricing)).toBe(false);
  });
  it("does not classify an ordinary model as a free variant", () => {
    expect(isVerifiedFreeModel("openrouter", "example/model", { prompt: "0", completion: "0" })).toBe(false);
  });
  it.each(["nvidia", "ollama", "mistral", "gemini"])("does not assume %s includes free account quota", provider => {
    expect(isVerifiedFreeModel(provider, "example/model:free", { prompt: "0", completion: "0" })).toBe(false);
  });
});

describe("paid fallback requires explicit runtime and connection opt-in", () => {
  it("keeps verified free routes available by default", () => expect(canRouteModel(true, false)).toBe(true));
  it.each([undefined, "", "false", "TRUE", "1"])("rejects paid fallback for setting %j", setting => {
    expect(canRouteModel(false, true, setting)).toBe(false);
  });
  it("rejects paid fallback without connection authorization", () => expect(canRouteModel(false, false, "true")).toBe(false));
  it("allows paid fallback only with both opt-ins", () => expect(canRouteModel(false, true, "true")).toBe(true));
});
