import { describe, expect, it } from "vitest";
import validDemo from "./fixtures/valid-demo.json";
import validMinimal from "./fixtures/valid-minimal.json";
import invalidMissing from "./fixtures/invalid-missing-fields.json";
import invalidSecret from "./fixtures/invalid-secret.json";
import { freshnessOf, validateProjectStatus } from "./status";

describe("validateProjectStatus", () => {
  it("accepts a complete valid document", () => {
    const r = validateProjectStatus(validDemo);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.project.id).toBe("relay");
      expect(r.value.progress?.percent).toBe(62);
      expect(r.value.milestones).toHaveLength(3);
    }
  });

  it("accepts a minimal document (no health, milestones, runs)", () => {
    const r = validateProjectStatus(validMinimal);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.health).toBeUndefined();
  });

  it("rejects non-object input", () => {
    for (const v of [null, 42, "x", []]) {
      const r = validateProjectStatus(v);
      expect(r.ok).toBe(false);
    }
  });

  it("rejects wrong contract id and missing generated_at", () => {
    const r = validateProjectStatus(invalidMissing);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const paths = r.errors.map((e) => e.path);
      expect(paths).toContain("contract");
      expect(paths).toContain("generated_at");
      expect(paths).toContain("project.id");
      expect(paths).toContain("project.name");
      expect(paths).toContain("health.state");
      expect(paths).toContain("milestones[0].id");
      expect(paths).toContain("milestones[0].state");
      expect(paths).toContain("runs[0].id");
      expect(paths).toContain("runs[0].status");
      expect(paths).toContain("attention[0].title");
      expect(paths).toContain("attention[0].severity");
      expect(paths).toContain("progress.percent");
    }
  });

  it("rejects credential-looking keys anywhere in the payload", () => {
    const r = validateProjectStatus(invalidSecret);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.some((e) => e.path.includes("api_token"))).toBe(true);
    }
  });

  it("does not require progress; rejects malformed progress when present", () => {
    const noProgress = validateProjectStatus({
      contract: "mat-console.status/1",
      generated_at: "2026-09-25T00:00:00Z",
      project: { id: "a", name: "A" },
    });
    expect(noProgress.ok).toBe(true);

    const badProgress = validateProjectStatus({
      contract: "mat-console.status/1",
      generated_at: "2026-09-25T00:00:00Z",
      project: { id: "a", name: "A" },
      progress: { percent: "sixty" },
    });
    expect(badProgress.ok).toBe(false);
  });

  it("rejects non-http evidence URLs", () => {
    const r = validateProjectStatus({
      contract: "mat-console.status/1",
      generated_at: "2026-09-25T00:00:00Z",
      project: { id: "a", name: "A" },
      milestones: [{ id: "m", title: "M", state: "done", evidence_url: "javascript:alert(1)" }],
    });
    expect(r.ok).toBe(false);
  });
});

describe("freshnessOf", () => {
  const base = {
    contract: "mat-console.status/1",
    generated_at: "2026-09-25T14:00:00Z",
    ttl_seconds: 3600,
    project: { id: "a", name: "A" },
  } as const;

  it("reports fresh within ttl", () => {
    const now = new Date("2026-09-25T14:30:00Z");
    expect(freshnessOf(base as never, now).freshness).toBe("fresh");
  });

  it("reports stale past ttl", () => {
    const now = new Date("2026-09-25T15:00:01Z");
    expect(freshnessOf(base as never, now).freshness).toBe("stale");
  });

  it("reports unknown when ttl is absent", () => {
    const { ttl_seconds: _dropped, ...noTtl } = base;
    const now = new Date("2026-09-30T00:00:00Z");
    expect(freshnessOf(noTtl as never, now).freshness).toBe("unknown");
  });
});
