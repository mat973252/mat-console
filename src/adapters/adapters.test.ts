import { describe, expect, it, vi } from "vitest";
import { validateProjectStatus } from "../contract/status";
import { createHttpAdapter } from "./http";
import { createMockAdapter } from "./mock";

describe("mock adapter", () => {
  it("is labeled as demo data", () => {
    expect(createMockAdapter().isDemo).toBe(true);
    expect(createMockAdapter().label).toContain("demo");
  });

  it("returns a payload that passes contract validation", async () => {
    const r = await createMockAdapter("demo").fetchStatus();
    expect(r.ok).toBe(true);
    if (r.ok) expect(validateProjectStatus(r.payload).ok).toBe(true);
  });

  it("returns a stale document for the stale variant", async () => {
    const r = await createMockAdapter("stale").fetchStatus();
    expect(r.ok).toBe(true);
    if (r.ok) {
      const v = validateProjectStatus(r.payload);
      expect(v.ok).toBe(true);
    }
  });

  it("reports a failure for the fails variant — never a healthy payload", async () => {
    const r = await createMockAdapter("fails").fetchStatus();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("network");
  });
});

describe("http adapter", () => {
  it("returns the payload for a 200 JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ contract: "mat-console.status/1" }), { status: 200 })),
    );
    const r = await createHttpAdapter({ url: "https://status.example.com/x.json" }).fetchStatus();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload).toEqual({ contract: "mat-console.status/1" });
    vi.unstubAllGlobals();
  });

  it("reports an http failure for non-2xx responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("nope", { status: 503 })));
    const r = await createHttpAdapter({ url: "https://status.example.com/x.json" }).fetchStatus();
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.kind).toBe("http");
      expect(r.error.httpStatus).toBe(503);
    }
    vi.unstubAllGlobals();
  });

  it("reports a network failure when fetch rejects (e.g. CORS)", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    const r = await createHttpAdapter({ url: "https://status.example.com/x.json" }).fetchStatus();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("network");
    vi.unstubAllGlobals();
  });

  it("reports not-json when the body cannot be parsed", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("<html>", { status: 200 })));
    const r = await createHttpAdapter({ url: "https://status.example.com/x.json" }).fetchStatus();
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe("not-json");
    vi.unstubAllGlobals();
  });
});
