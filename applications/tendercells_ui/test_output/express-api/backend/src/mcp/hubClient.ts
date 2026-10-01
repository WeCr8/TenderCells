// hubClient.ts - the MCP server's only way to reach the farm: the hub's own REST API
// (the same endpoints the OS and `tc` CLI use). The MCP layer never talks to MQTT or
// Firebase directly, so every hub rule still applies: device ownership, the E-STOP latch,
// the arm / weed / mower interlocks and payload validation.
//
// Environment:
//   TC_API    hub base URL (default http://localhost:$PORT, PORT defaults to 4000)
//   TC_TOKEN  Firebase ID token, sent as Bearer when the hub enforces accounts

export interface HubResponse {
  ok: boolean;
  status: number;
  body: unknown;
}

export type HubFetch = (path: string, init?: { method?: string; body?: unknown }) => Promise<HubResponse>;

/**
 * Build a client for the hub REST API.
 *
 * @param base  - Hub base URL, e.g. "http://localhost:4000"
 * @param token - Optional Firebase ID token for hubs that enforce accounts
 * @param fetchImpl - Injected fetch (tests)
 * @returns A function that calls one hub path and returns status + parsed body
 */
export function hubClient(
  base = process.env.TC_API || `http://localhost:${process.env.PORT || 4000}`,
  token = process.env.TC_TOKEN,
  fetchImpl: typeof fetch = fetch,
): HubFetch {
  const root = base.replace(/\/$/, "");
  return async (path, init = {}) => {
    const headers: Record<string, string> = {};
    if (init.body !== undefined) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = `Bearer ${token}`;
    try {
      const res = await fetchImpl(`${root}${path}`, {
        method: init.method ?? "GET",
        headers,
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
        signal: AbortSignal.timeout(10_000),
      });
      const text = await res.text();
      let body: unknown = text;
      try { body = JSON.parse(text); } catch { /* XML or plain text */ }
      return { ok: res.ok, status: res.status, body };
    } catch (err) {
      return { ok: false, status: 0, body: { error: `Hub not reachable at ${root}: ${(err as Error).message}` } };
    }
  };
}
