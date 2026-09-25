import type { AdapterFailure } from "../adapters/adapter";
import type { ValidationError } from "../contract/status";
import type { OverviewView } from "../lib/view";
import type { StatusAdapter } from "../adapters/adapter";

/** Provenance/state badges shown in the top bar. */
export function SourceBadges({
  adapter,
  freshness,
}: {
  adapter: StatusAdapter;
  freshness?: "fresh" | "stale" | "unknown";
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {freshness === "stale" && (
        <span className="rounded-full bg-warn-wash px-2.5 py-1 font-medium text-warn">
          stale data
        </span>
      )}
      <span className="rounded-full bg-mint-wash px-2.5 py-1 font-medium text-mint-ink">
        {adapter.isDemo ? `demo data · ${adapter.label}` : adapter.label}
      </span>
    </div>
  );
}

export function TopBar({
  adapter,
  projectName,
  freshness,
}: {
  adapter: StatusAdapter;
  projectName?: string;
  freshness?: "fresh" | "stale" | "unknown";
}) {
  return (
    <header className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-10">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-lg font-bold tracking-tight">mat.console</span>
        <span className="text-sm text-ink-soft">Project journal</span>
      </div>
      <div className="flex items-center gap-6">
        <nav aria-label="breadcrumb" className="hidden text-sm text-ink-soft sm:block">
          <ol className="flex items-center gap-2">
            <li>Projects</li>
            <li aria-hidden="true">/</li>
            <li>{projectName ?? "…"}</li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              Overview
            </li>
          </ol>
        </nav>
        <SourceBadges adapter={adapter} freshness={freshness} />
      </div>
    </header>
  );
}

const STATE_LABEL: Record<string, string> = {
  done: "done",
  current: "current",
  planned: "planned",
  blocked: "blocked",
};

function Timeline({ view }: { view: OverviewView }) {
  if (view.milestones.length === 0) return null;
  return (
    <section aria-labelledby="timeline-heading">
      <h2 id="timeline-heading" className="font-display text-2xl font-semibold">
        Milestones
      </h2>
      <ol className="mt-6 space-y-7 border-l border-line pl-6">
        {view.milestones.map((m) => {
          const isCurrent = m.state === "current";
          return (
            <li key={m.id} className="relative">
              <span
                aria-hidden="true"
                className={`absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper ${
                  isCurrent ? "bg-mint-ink" : m.state === "done" ? "bg-mint" : "bg-line"
                }`}
              />
              <p
                className={`text-xs font-medium tracking-wide ${
                  isCurrent ? "text-mint-ink" : "text-ink-soft"
                }`}
              >
                {STATE_LABEL[m.state] ?? m.state}
                {m.evidence_count && (
                  <span className="text-ink-soft">
                    {" "}
                    · {m.evidence_count.recorded} / {m.evidence_count.expected} acceptance records
                  </span>
                )}
              </p>
              <h3
                className={`mt-1 font-display text-lg font-semibold ${
                  isCurrent ? "text-ink" : "text-ink/85"
                }`}
              >
                {m.title}
              </h3>
              {m.description && <p className="mt-1 text-sm text-ink-soft">{m.description}</p>}
              {m.evidence_url && (
                <a
                  href={m.evidence_url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-sm font-medium text-mint-ink underline decoration-mint underline-offset-4 hover:decoration-mint-ink"
                >
                  View evidence ↗
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function SnapshotRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-line py-3 last:border-0">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{children}</dd>
    </div>
  );
}

const HEALTH_LABEL: Record<string, string> = {
  ok: "reported healthy",
  attention: "needs attention",
  degraded: "reported degraded",
  unknown: "not reported",
};

function Snapshot({ view }: { view: OverviewView }) {
  return (
    <aside aria-labelledby="snapshot-heading">
      <div className="border-t-4 border-ink pt-4">
        <h2 id="snapshot-heading" className="text-sm font-semibold tracking-wide">
          Current snapshot
        </h2>
        <dl className="mt-3">
          <SnapshotRow label="Reported health">
            <span
              className={
                view.healthState === "ok"
                  ? "text-mint-ink"
                  : view.healthState === "unknown"
                    ? "text-ink-soft"
                    : "text-warn"
              }
            >
              {HEALTH_LABEL[view.healthState]}
            </span>
          </SnapshotRow>
          <SnapshotRow label="Current milestone">
            {view.currentMilestone
              ? `${view.phaseIndex} · ${view.currentMilestone.title}`
              : "none in progress"}
          </SnapshotRow>
          <SnapshotRow label="Acceptance records">
            {view.evidenceRecorded !== undefined && view.evidenceExpected !== undefined
              ? `${view.evidenceRecorded} / ${view.evidenceExpected}`
              : "not reported"}
          </SnapshotRow>
          <SnapshotRow label="Recent failed run">
            {view.lastFailedRun ? (
              view.lastFailedRun.evidence_url ? (
                <a
                  className="text-danger underline decoration-danger/40 underline-offset-4"
                  href={view.lastFailedRun.evidence_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {view.lastFailedRun.label ?? view.lastFailedRun.id}
                </a>
              ) : (
                <span className="text-danger">{view.lastFailedRun.label ?? view.lastFailedRun.id}</span>
              )
            ) : (
              "none reported"
            )}
          </SnapshotRow>
          <SnapshotRow label="Blocked items">
            {view.blockedCount > 0 ? (
              <span className="text-danger">{view.blockedCount}</span>
            ) : (
              "0"
            )}
          </SnapshotRow>
        </dl>
      </div>

      <div className="mt-6 rounded-lg bg-mint-wash p-5" aria-labelledby="inspect-heading">
        <h2 id="inspect-heading" className="font-display text-lg font-semibold">
          What to inspect next
        </h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {view.nextInspection ? (
            view.nextInspection.url ? (
              <a
                href={view.nextInspection.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-mint-ink underline decoration-mint underline-offset-4"
              >
                {view.nextInspection.text} ↗
              </a>
            ) : (
              view.nextInspection.text
            )
          ) : (
            "Nothing needs review — no evidence link was provided."
          )}
        </p>
      </div>
    </aside>
  );
}

export function AttentionList({ view }: { view: OverviewView }) {
  if (view.attention.length === 0) return null;
  return (
    <section aria-labelledby="attention-heading" className="mt-10">
      <h2 id="attention-heading" className="font-display text-2xl font-semibold">
        Needs attention
      </h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {view.attention.map((a) => (
          <li key={a.id} className="flex items-baseline justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium">
                <span
                  className={`mr-2 inline-block rounded px-1.5 py-0.5 text-xs font-semibold ${
                    a.severity === "blocked"
                      ? "bg-danger-wash text-danger"
                      : a.severity === "warn"
                        ? "bg-warn-wash text-warn"
                        : "bg-line text-ink-soft"
                  }`}
                >
                  {a.severity}
                </span>
                {a.title}
              </p>
              {a.detail && <p className="mt-1 text-sm text-ink-soft">{a.detail}</p>}
            </div>
            {a.evidence_url && (
              <a
                href={a.evidence_url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-sm font-medium text-mint-ink underline decoration-mint underline-offset-4"
              >
                Evidence ↗
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function RunsList({ view }: { view: OverviewView }) {
  if (view.runs.length === 0) return null;
  return (
    <section aria-labelledby="runs-heading" className="mt-10">
      <h2 id="runs-heading" className="font-display text-2xl font-semibold">
        Recent runs
      </h2>
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {view.runs.map((r) => (
          <li key={r.id} className="flex items-baseline justify-between gap-4 py-3">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-sm font-semibold">{r.label ?? r.id}</span>
              <span
                className={`text-xs font-semibold ${
                  r.status === "failed"
                    ? "text-danger"
                    : r.status === "succeeded"
                      ? "text-mint-ink"
                      : "text-ink-soft"
                }`}
              >
                {r.status}
              </span>
            </div>
            <div className="flex items-baseline gap-4 text-sm text-ink-soft">
              {r.finished_at && <time dateTime={r.finished_at}>{formatTime(r.finished_at)}</time>}
              {r.evidence_url && (
                <a
                  href={r.evidence_url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-mint-ink underline decoration-mint underline-offset-4"
                >
                  Evidence ↗
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function JournalBody({ view, fetchedAt }: { view: OverviewView; fetchedAt: Date }) {
  const { status } = view;
  const summary =
    view.healthSummary ??
    status.project.summary ??
    "No current-state summary was reported.";
  return (
    <main className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-10">
      <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-mint-ink">
        {status.project.id} · current state
      </p>
      <h1 className="mt-3 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
        {status.project.name}
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-ink-soft">{summary}</p>

      <div className="mt-10 grid gap-12 border-t border-line pt-10 lg:grid-cols-[1fr_340px]">
        <div>
          <Timeline view={view} />
          <AttentionList view={view} />
          <RunsList view={view} />
        </div>
        <Snapshot view={view} />
      </div>

      <footer className="mt-12 space-y-1 text-xs text-ink-soft">
        <p>
          Source: {status.source?.label ?? "unspecified"}
          {status.source?.evidence_url && (
            <>
              {" · "}
              <a
                href={status.source.evidence_url}
                target="_blank"
                rel="noreferrer"
                className="text-mint-ink underline underline-offset-2"
              >
                status document
              </a>
            </>
          )}
        </p>
        <p>
          Reported at <time dateTime={status.generated_at}>{formatTime(status.generated_at)}</time>
          {" · fetched "}
          <time dateTime={fetchedAt.toISOString()}>{formatTime(fetchedAt.toISOString())}</time>
          {view.freshness === "stale" && (
            <span className="font-medium text-warn"> · stale (past reported TTL)</span>
          )}
          {view.freshness === "unknown" && " · freshness unknown (no TTL reported)"}
        </p>
        <p>Reported status is evidence, not verification.</p>
      </footer>
    </main>
  );
}

// --- Non-ready states -------------------------------------------------------

function StateShell({
  adapter,
  children,
}: {
  adapter: StatusAdapter;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto w-full max-w-3xl px-5 pb-16 sm:px-10">
      <div className="mt-16 rounded-lg border border-line bg-paper p-8">{children}</div>
      <p className="mt-4 text-xs text-ink-soft">Source: {adapter.label}</p>
    </main>
  );
}

export function LoadingState({ adapter }: { adapter: StatusAdapter }) {
  return (
    <StateShell adapter={adapter}>
      <p className="text-sm font-medium text-ink-soft" role="status">
        Loading project status…
      </p>
      <div className="mt-4 space-y-3" aria-hidden="true">
        <div className="h-6 w-2/3 animate-pulse rounded bg-line" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-line" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-line" />
      </div>
    </StateShell>
  );
}

export function ErrorState({
  adapter,
  error,
}: {
  adapter: StatusAdapter;
  error: AdapterFailure;
}) {
  return (
    <StateShell adapter={adapter}>
      <h1 className="font-display text-2xl font-semibold">Status could not be fetched</h1>
      <p className="mt-2 text-sm text-ink-soft">
        The console cannot reach the status source, so this project is <strong>not</strong> shown
        as healthy — its real state is unknown.
      </p>
      <dl className="mt-4 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="text-ink-soft">Error:</dt>
          <dd className="font-medium text-danger">
            {error.kind}
            {error.httpStatus ? ` ${error.httpStatus}` : ""}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink-soft">Detail:</dt>
          <dd>{error.message}</dd>
        </div>
        {adapter.sourceUrl && (
          <div className="flex gap-2">
            <dt className="text-ink-soft">URL:</dt>
            <dd className="break-all">{adapter.sourceUrl}</dd>
          </div>
        )}
      </dl>
      {adapter.id === "http" && (
        <p className="mt-4 text-sm text-ink-soft">
          If this is a remote endpoint, check that it returns the{" "}
          <code className="rounded bg-line px-1">mat-console.status/1</code> JSON and allows
          cross-origin reads (CORS). See docs/protocol-v1.md.
        </p>
      )}
    </StateShell>
  );
}

export function InvalidState({
  adapter,
  errors,
}: {
  adapter: StatusAdapter;
  errors: ValidationError[];
}) {
  return (
    <StateShell adapter={adapter}>
      <h1 className="font-display text-2xl font-semibold">Invalid status document</h1>
      <p className="mt-2 text-sm text-ink-soft">
        The source responded, but the payload does not satisfy{" "}
        <code className="rounded bg-line px-1">mat-console.status/1</code>. It is treated as
        unreported, not healthy.
      </p>
      <ul className="mt-4 max-h-64 list-disc space-y-1 overflow-auto pl-5 text-sm">
        {errors.map((e, i) => (
          <li key={i}>
            <code className="rounded bg-line px-1">{e.path}</code> — {e.message}
          </li>
        ))}
      </ul>
    </StateShell>
  );
}

export function EmptyState({
  adapter,
  projectName,
  generatedAt,
}: {
  adapter: StatusAdapter;
  projectName: string;
  generatedAt: string;
}) {
  return (
    <StateShell adapter={adapter}>
      <h1 className="font-display text-2xl font-semibold">{projectName}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        The status document is valid but reports no milestones, runs, or attention items yet —
        health is <strong>not reported</strong>.
      </p>
      <p className="mt-4 text-xs text-ink-soft">
        Reported at <time dateTime={generatedAt}>{formatTime(generatedAt)}</time>
      </p>
    </StateShell>
  );
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
