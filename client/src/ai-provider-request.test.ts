import { afterEach, describe, expect, it, vi } from "vitest";
import { requestModelAnswer } from "../../functions/_shared/ai-provider-request";
const url = "https://provider.invalid/chat/completions";
const init = { method: "POST" };
const mockFetch = (response: Response) =>
  vi.fn().mockResolvedValue(response) as unknown as typeof fetch;
afterEach(() => vi.useRealTimers());

describe("bounded provider fallback", () => {
  it("returns a trimmed answer", async () => {
    const result = await requestModelAnswer(
      url,
      init,
      mockFetch(
        Response.json({ choices: [{ message: { content: " answer " } }] })
      )
    );
    expect(result).toEqual({ answer: "answer", retryable: false });
  });
  it.each([402, 408, 429, 500, 502, 503, 504])(
    "allows fallback after status %s",
    async status => {
      expect(
        await requestModelAnswer(
          url,
          init,
          mockFetch(new Response(null, { status }))
        )
      ).toEqual({ answer: "", retryable: true });
    }
  );
  it.each([400, 401, 403, 404])(
    "stops after non-transient status %s",
    async status => {
      expect(
        await requestModelAnswer(
          url,
          init,
          mockFetch(new Response(null, { status }))
        )
      ).toEqual({ answer: "", retryable: false });
    }
  );
  it.each([
    {},
    null,
    { choices: [] },
    { choices: [{ message: { content: " " } }] },
    { choices: [{ message: { content: 42 } }] },
  ])("allows fallback for an unusable successful response %j", async body => {
    expect(
      await requestModelAnswer(url, init, mockFetch(Response.json(body)))
    ).toEqual({ answer: "", retryable: true });
  });
  it("allows fallback after malformed JSON", async () => {
    expect(
      await requestModelAnswer(url, init, mockFetch(new Response("not JSON")))
    ).toEqual({ answer: "", retryable: true });
  });
  it("allows fallback after a network rejection", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValue(
        new Error("connection failed")
      ) as unknown as typeof fetch;
    expect(await requestModelAnswer(url, init, fetcher)).toEqual({
      answer: "",
      retryable: true,
    });
  });
  it("aborts a stalled request and clears the timer", async () => {
    vi.useFakeTimers();
    let signal: AbortSignal | null | undefined;
    const fetcher = vi.fn(
      (_url: unknown, options?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          signal = options?.signal;
          signal?.addEventListener(
            "abort",
            () => reject(new Error("aborted")),
            { once: true }
          );
        })
    ) as unknown as typeof fetch;
    const result = requestModelAnswer(url, init, fetcher, 25);
    await vi.advanceTimersByTimeAsync(25);
    expect(await result).toEqual({ answer: "", retryable: true });
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
  it("clears the timer after success", async () => {
    vi.useFakeTimers();
    await requestModelAnswer(
      url,
      init,
      mockFetch(Response.json({ choices: [{ message: { content: "ok" } }] }))
    );
    expect(vi.getTimerCount()).toBe(0);
  });
});
