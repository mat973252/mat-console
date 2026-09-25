/**
 * mat-console project status contract, version "mat-console.status/1".
 *
 * A producer (CI job, agent, server endpoint, static file) emits this JSON to
 * describe the *reported* state of a project. The console renders it read-only.
 *
 * Trust rules enforced here:
 * - `progress` is optional and must be omitted when the reporter does not know
 *   it. Nothing downstream may infer it from milestone or task counts.
 * - `health.state` may be "unknown"; freshness is derived separately from
 *   `generated_at` + `ttl_seconds`, so unknown/stale/reported stay distinct.
 * - The document must not carry secrets; keys that look like credentials are
 *   rejected during validation.
 *
 * See docs/protocol-v1.md for the human-readable spec.
 */

export const CONTRACT_ID = "mat-console.status/1" as const;

export type HealthState = "ok" | "attention" | "degraded" | "unknown";
export type MilestoneState = "done" | "current" | "planned" | "blocked";
export type RunStatus = "succeeded" | "failed" | "running" | "cancelled" | "unknown";
export type AttentionSeverity = "info" | "warn" | "blocked";

export interface ProjectIdentity {
  id: string;
  name: string;
  /** Optional one-line description of the project. */
  summary?: string;
}

export interface StatusSource {
  /** What produced this document, e.g. "github-actions", "agent-report", "manual". */
  label?: string;
  /** URL where this document (or its producer) can be inspected. */
  url?: string;
  /** Optional link backing the document as a whole. */
  evidence_url?: string;
}

export interface Health {
  state: HealthState;
  /** One-sentence reported state, e.g. "moving toward resumable execution". */
  summary?: string;
}

export interface Milestone {
  id: string;
  title: string;
  state: MilestoneState;
  description?: string;
  /** Link to whatever evidences this milestone (acceptance record, PR, run). */
  evidence_url?: string;
  /** When the reporter last confirmed this milestone's state. */
  updated_at?: string;
  /** Optional acceptance counts a reporter already knows. Never used to
   *  derive a percentage. */
  evidence_count?: { recorded: number; expected: number };
}

export interface ProjectRun {
  id: string;
  /** Human label such as "#140". Defaults to id when omitted. */
  label?: string;
  status: RunStatus;
  started_at?: string;
  finished_at?: string;
  evidence_url?: string;
}

export interface AttentionItem {
  id: string;
  title: string;
  detail?: string;
  severity: AttentionSeverity;
  evidence_url?: string;
}

export interface ProjectStatus {
  contract: typeof CONTRACT_ID;
  /** ISO-8601 time the source produced this document (required). */
  generated_at: string;
  /** Optional freshness budget; the console marks data stale past this age. */
  ttl_seconds?: number;
  project: ProjectIdentity;
  source?: StatusSource;
  /** Optional; absent is equivalent to { state: "unknown" }. */
  health?: Health;
  /** Optional. Omit when the reporter cannot honestly compute progress.
   *  `percent` is 0–100; `basis` is free text explaining what it counts. */
  progress?: { percent: number; basis?: string };
  milestones?: Milestone[];
  runs?: ProjectRun[];
  attention?: AttentionItem[];
}

export interface ValidationError {
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; value: ProjectStatus }
  | { ok: false; errors: ValidationError[] };

const HEALTH_STATES: HealthState[] = ["ok", "attention", "degraded", "unknown"];
const MILESTONE_STATES: MilestoneState[] = ["done", "current", "planned", "blocked"];
const RUN_STATUSES: RunStatus[] = ["succeeded", "failed", "running", "cancelled", "unknown"];
const SEVERITIES: AttentionSeverity[] = ["info", "warn", "blocked"];

/** Keys that suggest credential material anywhere in the payload. */
const SECRET_KEY_PATTERN = /(secret|token|passw(?:or)?d|credential|api[_-]?key|bearer|private[_-]?key)/i;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const isIsoDate = (v: unknown): v is string =>
  typeof v === "string" && !Number.isNaN(Date.parse(v));

const isUrl = (v: unknown): v is string => {
  if (typeof v !== "string") return false;
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

export function validateProjectStatus(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  const err = (path: string, message: string) => errors.push({ path, message });

  if (!isRecord(input)) {
    return { ok: false, errors: [{ path: "$", message: "document must be a JSON object" }] };
  }

  if (input.contract !== CONTRACT_ID) {
    err("contract", `must equal "${CONTRACT_ID}"`);
  }
  if (!isIsoDate(input.generated_at)) {
    err("generated_at", "required ISO-8601 timestamp of when the source produced this document");
  }
  if (input.ttl_seconds !== undefined) {
    if (typeof input.ttl_seconds !== "number" || input.ttl_seconds < 0) {
      err("ttl_seconds", "must be a non-negative number of seconds");
    }
  }

  if (!isRecord(input.project)) {
    err("project", "required object with project identity");
  } else {
    if (typeof input.project.id !== "string" || input.project.id === "") {
      err("project.id", "required non-empty string");
    }
    if (typeof input.project.name !== "string" || input.project.name === "") {
      err("project.name", "required non-empty string");
    }
    if (input.project.summary !== undefined && typeof input.project.summary !== "string") {
      err("project.summary", "must be a string");
    }
  }

  if (input.source !== undefined) {
    if (!isRecord(input.source)) {
      err("source", "must be an object");
    } else {
      for (const k of ["label"] as const) {
        if (input.source[k] !== undefined && typeof input.source[k] !== "string") {
          err(`source.${k}`, "must be a string");
        }
      }
      for (const k of ["url", "evidence_url"] as const) {
        if (input.source[k] !== undefined && !isUrl(input.source[k])) {
          err(`source.${k}`, "must be an http(s) URL");
        }
      }
    }
  }

  if (input.health !== undefined) {
    if (!isRecord(input.health)) {
      err("health", "must be an object");
    } else {
      if (!HEALTH_STATES.includes(input.health.state as HealthState)) {
        err("health.state", `must be one of ${HEALTH_STATES.join(", ")}`);
      }
      if (input.health.summary !== undefined && typeof input.health.summary !== "string") {
        err("health.summary", "must be a string");
      }
    }
  }

  if (input.progress !== undefined) {
    if (!isRecord(input.progress)) {
      err("progress", "must be an object");
    } else {
      const p = input.progress.percent;
      if (typeof p !== "number" || p < 0 || p > 100) {
        err("progress.percent", "must be a number between 0 and 100 (omit `progress` when unknown)");
      }
      if (input.progress.basis !== undefined && typeof input.progress.basis !== "string") {
        err("progress.basis", "must be a string");
      }
    }
  }

  const checkArray = (key: "milestones" | "runs" | "attention") => {
    if (input[key] === undefined) return [] as Record<string, unknown>[];
    if (!Array.isArray(input[key])) {
      err(key, "must be an array");
      return [] as Record<string, unknown>[];
    }
    return input[key] as Record<string, unknown>[];
  };

  checkArray("milestones").forEach((m, i) => {
    const p = `milestones[${i}]`;
    if (!isRecord(m)) return err(p, "must be an object");
    if (typeof m.id !== "string" || m.id === "") err(`${p}.id`, "required non-empty string");
    if (typeof m.title !== "string" || m.title === "") err(`${p}.title`, "required non-empty string");
    if (!MILESTONE_STATES.includes(m.state as MilestoneState)) {
      err(`${p}.state`, `must be one of ${MILESTONE_STATES.join(", ")}`);
    }
    if (m.description !== undefined && typeof m.description !== "string") {
      err(`${p}.description`, "must be a string");
    }
    if (m.evidence_url !== undefined && !isUrl(m.evidence_url)) {
      err(`${p}.evidence_url`, "must be an http(s) URL");
    }
    if (m.updated_at !== undefined && !isIsoDate(m.updated_at)) {
      err(`${p}.updated_at`, "must be an ISO-8601 timestamp");
    }
    if (m.evidence_count !== undefined) {
      const ec = m.evidence_count;
      if (!isRecord(ec) || typeof ec.recorded !== "number" || typeof ec.expected !== "number") {
        err(`${p}.evidence_count`, "must be { recorded: number, expected: number }");
      }
    }
  });

  checkArray("runs").forEach((r, i) => {
    const p = `runs[${i}]`;
    if (!isRecord(r)) return err(p, "must be an object");
    if (typeof r.id !== "string" || r.id === "") err(`${p}.id`, "required non-empty string");
    if (r.label !== undefined && typeof r.label !== "string") err(`${p}.label`, "must be a string");
    if (!RUN_STATUSES.includes(r.status as RunStatus)) {
      err(`${p}.status`, `must be one of ${RUN_STATUSES.join(", ")}`);
    }
    for (const k of ["started_at", "finished_at"] as const) {
      if (r[k] !== undefined && !isIsoDate(r[k])) err(`${p}.${k}`, "must be an ISO-8601 timestamp");
    }
    if (r.evidence_url !== undefined && !isUrl(r.evidence_url)) {
      err(`${p}.evidence_url`, "must be an http(s) URL");
    }
  });

  checkArray("attention").forEach((a, i) => {
    const p = `attention[${i}]`;
    if (!isRecord(a)) return err(p, "must be an object");
    if (typeof a.id !== "string" || a.id === "") err(`${p}.id`, "required non-empty string");
    if (typeof a.title !== "string" || a.title === "") err(`${p}.title`, "required non-empty string");
    if (a.detail !== undefined && typeof a.detail !== "string") err(`${p}.detail`, "must be a string");
    if (!SEVERITIES.includes(a.severity as AttentionSeverity)) {
      err(`${p}.severity`, `must be one of ${SEVERITIES.join(", ")}`);
    }
    if (a.evidence_url !== undefined && !isUrl(a.evidence_url)) {
      err(`${p}.evidence_url`, "must be an http(s) URL");
    }
  });

  // Secret scan: walk the raw payload and reject credential-looking keys.
  const walk = (node: unknown, path: string) => {
    if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, `${path}[${i}]`));
    } else if (isRecord(node)) {
      for (const [k, v] of Object.entries(node)) {
        if (SECRET_KEY_PATTERN.test(k)) {
          err(`${path}.${k}`, "key looks like a credential; status documents must not carry secrets");
        }
        walk(v, `${path}.${k}`);
      }
    }
  };
  walk(input, "$");

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: input as unknown as ProjectStatus };
}

// ---------------------------------------------------------------------------
// Derived state helpers (pure; `now` is injectable for tests and Storybook).
// ---------------------------------------------------------------------------

export type Freshness = "fresh" | "stale" | "unknown";

export function freshnessOf(status: ProjectStatus, now: Date): {
  freshness: Freshness;
  ageSeconds: number;
} {
  const generated = Date.parse(status.generated_at);
  if (Number.isNaN(generated)) return { freshness: "unknown", ageSeconds: 0 };
  const ageSeconds = Math.max(0, Math.floor((now.getTime() - generated) / 1000));
  if (status.ttl_seconds === undefined) return { freshness: "unknown", ageSeconds };
  return { freshness: ageSeconds > status.ttl_seconds ? "stale" : "fresh", ageSeconds };
}
