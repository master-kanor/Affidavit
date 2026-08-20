import { describe, expect, it } from "vitest";

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const runExternalValidation = process.env.RUN_EXTERNAL_CREDENTIAL_TESTS === "1";

describe("Cloudflare production credentials", () => {
  it("has the required non-empty configuration names available", () => {
    expect(token, "CLOUDFLARE_API_TOKEN is required").toBeTruthy();
    expect(accountId, "CLOUDFLARE_ACCOUNT_ID is required").toBeTruthy();
  });

  it.skipIf(!runExternalValidation)(
    "can read the intended account Pages endpoint when explicitly enabled",
    async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      try {
        const response = await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${accountId}/pages/projects?per_page=1`,
          {
            signal: controller.signal,
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        const body = (await response.json()) as {
          success?: boolean;
          errors?: Array<{ code?: number; message?: string }>;
        };

        expect(
          response.ok && body.success === true,
          body.errors
            ?.map(
              (error) =>
                `${error.code ?? "unknown"}: ${error.message ?? "unknown error"}`,
            )
            .join("; ") ?? `HTTP ${response.status}`,
        ).toBe(true);
      } finally {
        clearTimeout(timeout);
      }
    },
    20_000,
  );
});

// Deliberately avoids printing credentials or the response body.
// Run the external check only when network access is intended:
// RUN_EXTERNAL_CREDENTIAL_TESTS=1 pnpm vitest run client/src/cloudflare-credentials.test.ts
