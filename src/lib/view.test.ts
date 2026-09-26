import { describe, expect, it } from "vitest";
import type { ProjectStatus } from "../contract/status";
import { deriveOverview } from "./view";

const base: ProjectStatus = {
  contract: "mat-console.status/1",
  generated_at: "2026-09-25T14:00:00Z",
  project: { id: "a", name: "A" },
};

describe("deriveOverview — lastFailedRun", () => {
  it("selects the most recent failed run even when document order is oldest-first", () => {
    const view = deriveOverview(
      {
        ...base,
        runs: [
          { id: "old", status: "failed", finished_at: "2026-09-20T10:00:00Z" },
          { id: "ok", status: "succeeded", finished_at: "2026-09-24T10:00:00Z" },
          { id: "new", status: "failed", finished_at: "2026-09-24T12:00:00Z" },
          { id: "mid", status: "failed", finished_at: "2026-09-22T10:00:00Z" },
        ],
      },
      new Date("2026-09-25T15:00:00Z"),
    );
    expect(view.lastFailedRun?.id).toBe("new");
  });

  it("uses started_at when finished_at is absent", () => {
    const view = deriveOverview(
      {
        ...base,
        runs: [
          { id: "early", status: "failed", started_at: "2026-09-20T10:00:00Z" },
          { id: "late", status: "failed", started_at: "2026-09-24T10:00:00Z" },
        ],
      },
      new Date("2026-09-25T15:00:00Z"),
    );
    expect(view.lastFailedRun?.id).toBe("late");
  });

  it("falls back to document order when no failed run has a timestamp", () => {
    const view = deriveOverview(
      {
        ...base,
        runs: [
          { id: "first", status: "failed" },
          { id: "second", status: "failed" },
        ],
      },
      new Date("2026-09-25T15:00:00Z"),
    );
    expect(view.lastFailedRun?.id).toBe("first");
  });
});
