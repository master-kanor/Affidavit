/** Conservative catalog eligibility; does not establish account quota or live readiness. */
export function isVerifiedFreeModel(
  provider: string,
  modelId: string,
  pricing: Record<string, unknown> | null | undefined
): boolean {
  if (provider !== "openrouter" || !modelId.endsWith(":free") || !pricing)
    return false;
  const explicitZero = (value: unknown): boolean =>
    (typeof value === "number" ||
      (typeof value === "string" && value.trim() !== "")) &&
    Number.isFinite(Number(value)) &&
    Number(value) === 0;
  return (
    explicitZero(pricing.prompt) &&
    explicitZero(pricing.completion) &&
    Object.values(pricing).every(explicitZero)
  );
}

/** Stored free flags alone cannot authorize spend; paid fallback is opt-in twice. */
export function canRouteModel(
  modelIsVerifiedFree: boolean,
  connectionAllowsPaidBackup: boolean,
  paidFallbackSetting?: string
): boolean {
  return (
    modelIsVerifiedFree ||
    (paidFallbackSetting === "true" && connectionAllowsPaidBackup)
  );
}
