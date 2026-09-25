import { useEffect, useState } from "react";
import type { AdapterFailure, StatusAdapter } from "../adapters/adapter";
import { validateProjectStatus, type ValidationError } from "../contract/status";
import { deriveOverview, type OverviewView } from "../lib/view";
import {
  EmptyState,
  ErrorState,
  InvalidState,
  JournalBody,
  LoadingState,
  TopBar,
} from "./journal";

export type LoadState =
  | { kind: "loading" }
  | { kind: "error"; error: AdapterFailure }
  | { kind: "invalid"; errors: ValidationError[]; fetchedAt: Date }
  | { kind: "ready"; view: OverviewView; fetchedAt: Date };

export function useStatus(adapter: StatusAdapter, now = new Date()): LoadState {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  useEffect(() => {
    const ctrl = new AbortController();
    let cancelled = false;
    adapter
      .fetchStatus(ctrl.signal)
      .then((result) => {
        if (cancelled) return;
        if (!result.ok) {
          setState({ kind: "error", error: result.error });
          return;
        }
        const validated = validateProjectStatus(result.payload);
        if (!validated.ok) {
          setState({ kind: "invalid", errors: validated.errors, fetchedAt: result.fetchedAt });
          return;
        }
        setState({
          kind: "ready",
          view: deriveOverview(validated.value, now),
          fetchedAt: result.fetchedAt,
        });
      })
      .catch((e) => {
        if (!cancelled) {
          setState({
            kind: "error",
            error: { kind: "network", message: e instanceof Error ? e.message : String(e) },
          });
        }
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [adapter]);
  return state;
}

export function OverviewPage({ adapter }: { adapter: StatusAdapter }) {
  const state = useStatus(adapter);
  const projectName =
    state.kind === "ready" ? state.view.status.project.name : undefined;
  const freshness = state.kind === "ready" ? state.view.freshness : undefined;

  return (
    <div className="min-h-screen">
      <TopBar adapter={adapter} projectName={projectName} freshness={freshness} />
      {state.kind === "loading" && <LoadingState adapter={adapter} />}
      {state.kind === "error" && <ErrorState adapter={adapter} error={state.error} />}
      {state.kind === "invalid" && <InvalidState adapter={adapter} errors={state.errors} />}
      {state.kind === "ready" &&
        (isEmptyView(state.view) ? (
          <EmptyState
            adapter={adapter}
            projectName={state.view.status.project.name}
            generatedAt={state.view.status.generated_at}
          />
        ) : (
          <JournalBody view={state.view} fetchedAt={state.fetchedAt} />
        ))}
    </div>
  );
}

function isEmptyView(view: OverviewView): boolean {
  return (
    view.milestones.length === 0 &&
    view.runs.length === 0 &&
    view.attention.length === 0
  );
}
