import type { AdapterResult, StatusAdapter } from "./adapter";

export type MockVariant = "demo" | "stale" | "empty" | "invalid" | "fails";

/**
 * Mock adapter returning fabricated, clearly-labeled demo content. Every
 * variant here is invented — "Relay" is not a real project and none of the
 * links, runs, or counts describe live systems.
 */
export function createMockAdapter(variant: MockVariant = "demo"): StatusAdapter {
  return {
    id: `mock:${variant}`,
    label: "mock adapter (demo)",
    sourceUrl: undefined,
    isDemo: true,
    async fetchStatus(signal): Promise<AdapterResult> {
      // Simulate a small network delay so loading states are visible.
      await new Promise((r) => setTimeout(r, 350));
      if (signal?.aborted) {
        return { ok: false, error: { kind: "aborted", message: "request aborted" } };
      }
      if (variant === "fails") {
        return {
          ok: false,
          error: { kind: "network", message: "simulated fetch failure (mock adapter)" },
        };
      }
      return { ok: true, payload: mockPayload(variant), fetchedAt: new Date() };
    },
  };
}

function mockPayload(variant: MockVariant): unknown {
  switch (variant) {
    case "empty":
      return {
        contract: "mat-console.status/1",
        generated_at: new Date().toISOString(),
        project: { id: "empty-proto", name: "Unwritten Project" },
        health: { state: "unknown" },
      };
    case "invalid":
      return {
        contract: "mat-console.status/0",
        project: { name: "" },
        health: { state: "on-fire" },
        milestones: [{ title: "missing id and state" }],
        progress: { percent: 140 },
      };
    case "stale":
      return staleStatus();
    default:
      return demoStatus();
  }
}

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

/** Fabricated demo project — not a real system. */
export function demoStatus(): unknown {
  return {
    contract: "mat-console.status/1",
    generated_at: new Date().toISOString(),
    ttl_seconds: 3600,
    project: {
      id: "relay",
      name: "Relay",
      summary: "Durable workflow runtime prototype.",
    },
    source: {
      label: "mock adapter",
    },
    health: {
      state: "attention",
      summary: "Moving toward resumable execution; one blocked item and one failed run need review.",
    },
    milestones: [
      {
        id: "m1",
        title: "Runtime Core",
        state: "done",
        description: "Core execution and tool boundaries have acceptance records.",
      },
      {
        id: "m2",
        title: "State Persistence",
        state: "done",
        description: "Persistence paths recorded; failure recovery still being verified.",
      },
      {
        id: "m3",
        title: "Durable Execution",
        state: "current",
        description: "Read-only checks for unknown results and the link boundary.",
        evidence_count: { recorded: 6, expected: 9 },
      },
      {
        id: "m4",
        title: "Artifact Lineage",
        state: "planned",
        description: "Starts after the current milestone is accepted.",
      },
    ],
    runs: [
      {
        id: "run-141",
        label: "#141",
        status: "running",
        started_at: hoursAgo(0.5),
      },
      {
        id: "run-140",
        label: "#140",
        status: "failed",
        started_at: hoursAgo(3),
        finished_at: hoursAgo(2.8),
      },
      {
        id: "run-139",
        label: "#139",
        status: "succeeded",
        started_at: hoursAgo(26),
        finished_at: hoursAgo(25.7),
      },
    ],
    attention: [
      {
        id: "a1",
        title: "Timeout boundary for unknown results is unverified",
        severity: "blocked",
        detail: "Two acceptance checks depend on this boundary.",
      },
      {
        id: "a2",
        title: "Artifact link policy needs a second reviewer",
        severity: "warn",
      },
    ],
  };
}

/** Same project, but generated long past its TTL — demonstrates stale data. */
export function staleStatus(): unknown {
  return {
    contract: "mat-console.status/1",
    generated_at: hoursAgo(30),
    ttl_seconds: 3600,
    project: { id: "relay", name: "Relay" },
    source: { label: "mock adapter" },
    health: { state: "ok", summary: "Reported healthy 30 hours ago." },
    milestones: [
      {
        id: "m1",
        title: "Runtime Core",
        state: "done",
        description: "Recorded before the report went stale.",
      },
      {
        id: "m2",
        title: "State Persistence",
        state: "current",
      },
    ],
    runs: [
      {
        id: "run-120",
        label: "#120",
        status: "succeeded",
        started_at: hoursAgo(31),
        finished_at: hoursAgo(30.5),
      },
    ],
    attention: [],
  };
}
