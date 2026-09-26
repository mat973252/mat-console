import {
  freshnessOf,
  type AttentionItem,
  type Milestone,
  type ProjectRun,
  type ProjectStatus,
} from "../contract/status";

export interface OverviewView {
  status: ProjectStatus;
  freshness: "fresh" | "stale" | "unknown";
  ageSeconds: number;
  healthState: "ok" | "attention" | "degraded" | "unknown";
  healthSummary?: string;
  milestones: Milestone[];
  currentMilestone?: Milestone;
  phaseIndex?: number; // 1-based index of current milestone
  runs: ProjectRun[];
  lastFailedRun?: ProjectRun;
  attention: AttentionItem[];
  blockedCount: number;
  evidenceRecorded?: number;
  evidenceExpected?: number;
  /** Suggested next inspection: most relevant evidence link, if any. */
  nextInspection?: { text: string; url?: string };
}

export function deriveOverview(status: ProjectStatus, now: Date): OverviewView {
  const { freshness, ageSeconds } = freshnessOf(status, now);
  const milestones = status.milestones ?? [];
  const runs = status.runs ?? [];
  const attention = status.attention ?? [];

  const currentIdx = milestones.findIndex((m) => m.state === "current");
  const currentMilestone = currentIdx >= 0 ? milestones[currentIdx] : undefined;

  // Most recent failed run: ordered by finished_at, then started_at. When no
  // failed run carries a timestamp, fall back to document order (first match).
  const failedRuns = runs.filter((r) => r.status === "failed");
  const runTime = (r: ProjectRun) =>
    Date.parse(r.finished_at ?? "") || Date.parse(r.started_at ?? "") || Number.NEGATIVE_INFINITY;
  const timedFailed = failedRuns.filter((r) => Number.isFinite(runTime(r)));
  const lastFailedRun =
    timedFailed.length > 0
      ? timedFailed.reduce((a, b) => (runTime(b) > runTime(a) ? b : a))
      : failedRuns[0];
  const blockedCount = attention.filter((a) => a.severity === "blocked").length;

  const evidenceRecorded = currentMilestone?.evidence_count?.recorded;
  const evidenceExpected = currentMilestone?.evidence_count?.expected;

  let nextInspection: OverviewView["nextInspection"];
  if (lastFailedRun) {
    nextInspection = {
      text: `Inspect failed run ${lastFailedRun.label ?? lastFailedRun.id}`,
      url: lastFailedRun.evidence_url,
    };
  } else if (attention.some((a) => a.severity === "blocked")) {
    const blocked = attention.find((a) => a.severity === "blocked")!;
    nextInspection = { text: `Review blocked item: ${blocked.title}`, url: blocked.evidence_url };
  } else if (currentMilestone) {
    nextInspection = {
      text: `Review current milestone: ${currentMilestone.title}`,
      url: currentMilestone.evidence_url,
    };
  } else if (attention.some((a) => a.evidence_url)) {
    const item = attention.find((a) => a.evidence_url)!;
    nextInspection = { text: `Review item: ${item.title}`, url: item.evidence_url };
  } else if (status.source?.evidence_url) {
    nextInspection = { text: "Review source evidence", url: status.source.evidence_url };
  }

  return {
    status,
    freshness,
    ageSeconds,
    healthState: status.health?.state ?? "unknown",
    healthSummary: status.health?.summary,
    milestones,
    currentMilestone,
    phaseIndex: currentIdx >= 0 ? currentIdx + 1 : undefined,
    runs,
    lastFailedRun,
    attention,
    blockedCount,
    evidenceRecorded,
    evidenceExpected,
    nextInspection,
  };
}
