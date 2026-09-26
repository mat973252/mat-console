import type { AdapterResult, StatusAdapter } from "./adapter";

export interface HttpAdapterOptions {
  /** URL that serves a `mat-console.status/1` JSON document. */
  url: string;
  /** Label shown in the UI; defaults to the URL's host. */
  label?: string;
  /**
   * Optional extra request headers.
   *
   * Limitations (see docs/protocol-v1.md):
   * - The endpoint must allow cross-origin browser reads (CORS
   *   `Access-Control-Allow-Origin`), otherwise the fetch fails at the
   *   network layer — there is no proxy in this stage.
   * - Only unauthenticated or pre-authorized endpoints work in practice:
   *   the demo ships no credentials, and static Authorization headers are
   *   visible to anyone who opens the demo. Endpoints needing cookies or
   *   OAuth are out of scope until a project implements its own adapter.
   */
  headers?: Record<string, string>;
}

export function createHttpAdapter(options: HttpAdapterOptions): StatusAdapter {
  const { url } = options;
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* keep the raw string as the label fallback */
  }
  return {
    id: "http",
    label: options.label ?? `http: ${host}`,
    sourceUrl: url,
    isDemo: false,
    async fetchStatus(signal): Promise<AdapterResult> {
      let res: Response;
      try {
        res = await fetch(url, {
          signal,
          headers: { Accept: "application/json", ...options.headers },
        });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") {
          return { ok: false, error: { kind: "aborted", message: "request aborted" } };
        }
        return {
          ok: false,
          error: {
            kind: "network",
            message: `fetch failed: ${e instanceof Error ? e.message : String(e)}`,
          },
        };
      }
      if (!res.ok) {
        return {
          ok: false,
          error: {
            kind: "http",
            httpStatus: res.status,
            message: `HTTP ${res.status} ${res.statusText}`,
          },
        };
      }
      try {
        const payload = (await res.json()) as unknown;
        return { ok: true, payload, fetchedAt: new Date() };
      } catch {
        return {
          ok: false,
          error: { kind: "not-json", message: "response was not valid JSON" },
        };
      }
    },
  };
}
