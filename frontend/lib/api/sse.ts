import { API_BASE_URL, getStoredToken } from "./config";

/**
 * Fetch-based SSE reader. Native EventSource cannot send Authorization headers,
 * which we need for JWT Bearer (ADR 0005 + 0004). Orval does not generate this.
 */
export async function readSseStream(
  path: string,
  onEvent: (data: unknown) => void,
  signal?: AbortSignal,
): Promise<void> {
  const token = getStoredToken();
  if (!token) throw new Error("Not authenticated");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "GET",
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${token}`,
    },
    signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE failed (${response.status})`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const dataLine = chunk.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      const raw = dataLine.slice(5).trim();
      try {
        onEvent(JSON.parse(raw));
      } catch {
        onEvent(raw);
      }
    }
  }
}
