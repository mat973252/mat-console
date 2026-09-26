/**
 * Adapter interface: any source of a mat-console status document implements
 * this. An adapter returns the *raw* payload; validation is a separate step so
 * that "fetch failed" and "payload invalid" stay distinct UI states.
 */

export type AdapterFailureKind = "network" | "http" | "not-json" | "aborted";

export interface AdapterFailure {
  kind: AdapterFailureKind;
  message: string;
  /** HTTP status code when kind === "http". */
  httpStatus?: number;
}

export type AdapterResult =
  | { ok: true; payload: unknown; fetchedAt: Date }
  | { ok: false; error: AdapterFailure };

export interface StatusAdapter {
  /** Stable id, e.g. "mock", "http". */
  readonly id: string;
  /** Human-readable source label shown in the UI, e.g. "mock adapter". */
  readonly label: string;
  /** Where the data came from, when applicable (shown as the source URL). */
  readonly sourceUrl?: string;
  /** True when the adapter returns fabricated demo content — the UI must
   *  show an explicit demo badge. */
  readonly isDemo: boolean;
  fetchStatus(signal?: AbortSignal): Promise<AdapterResult>;
}
