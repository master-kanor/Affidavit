export type CopyErrorBreakdownResult = {
  ok: boolean;
  message: string;
};

export async function copyErrorBreakdown(errors: readonly string[]): Promise<CopyErrorBreakdownResult> {
  if (errors.length === 0) {
    return { ok: false, message: "There are no file errors to copy." };
  }

  const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
  if (!clipboard?.writeText) {
    return { ok: false, message: "Clipboard access was unavailable. Select and copy the error list manually." };
  }

  const content = [
    "Batch ZIP error breakdown",
    "",
    ...errors.map((error, index) => `${index + 1}. ${error}`),
  ].join("\n");

  try {
    await clipboard.writeText(content);
    return { ok: true, message: "Error breakdown copied to clipboard." };
  } catch {
    return { ok: false, message: "Clipboard access was unavailable. Select and copy the error list manually." };
  }
}
