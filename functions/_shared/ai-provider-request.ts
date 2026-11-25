type ModelResult = { answer: string; retryable: boolean };

/** Bounds the full provider response, including JSON parsing, without logging credentials. */
export async function requestModelAnswer(
  url: string,
  init: RequestInit,
  fetcher: typeof fetch = fetch,
  timeoutMs = 10_000
): Promise<ModelResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, { ...init, signal: controller.signal });
    if (!response.ok) {
      return {
        answer: "",
        retryable: [402, 408, 429, 500, 502, 503, 504].includes(
          response.status
        ),
      };
    }
    const result = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const content = result?.choices?.[0]?.message?.content;
    const answer = typeof content === "string" ? content.trim() : "";
    return { answer, retryable: answer.length === 0 };
  } catch {
    return { answer: "", retryable: true };
  } finally {
    clearTimeout(timer);
  }
}
