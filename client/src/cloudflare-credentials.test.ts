import { describe, expect, it } from "vitest";

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const runExternalValidation = process.env.RUN_EXTERNAL_CREDENTIAL_TESTS === "1";

describe("Cloudflare production credentials", () => {
  it("does not require private deployment credentials in ordinary tests", () => {
    expect(typeof token === "undefined" || typeof token === "string").toBe(true);
    expect(typeof accountId === "undefined" || typeof accountId === "string").toBe(true);
  });

  it.skipIf(!runExternalValidation)("can read the intended account Pages endpoint when explicitly enabled", async () => {
    expect(token).toBeTruthy();
    expect(accountId).toBeTruthy();
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects?per_page=1`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
    const body = await response.json() as { success?: boolean };
    expect(response.ok && body.success === true).toBe(true);
  });
});
