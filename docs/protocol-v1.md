# mat-console.status/1 — project status contract

Version `mat-console.status/1`. A producer (CI job, agent, scheduled script, or
a static file) emits one JSON document describing the **reported** state of a
project. The console renders it read-only; it does not verify it.

The canonical machine-checkable reference is the validator in
`src/contract/status.ts` (`validateProjectStatus`), with typed fixtures under
`src/contract/fixtures/`.

## Trust model

- **Reported, not verified.** Everything in the document is a claim by the
  source. The UI always labels the source and shows when it was generated.
- **Never invent progress.** `progress` is optional and must be **omitted when
  the reporter cannot honestly compute it**. The console never derives a
  percentage from milestone or task counts — `milestones[].evidence_count` is
  displayed as a raw "n / m" count only.
- **Unknown ≠ stale ≠ reported.** `health.state` may be `"unknown"` or the
  whole `health` object may be absent. Freshness is computed separately from
  `generated_at` + `ttl_seconds`, so a document can be *fresh but unknown* or
  *stale but reported-healthy*.
- **No secrets.** The document is meant to be public. The validator rejects
  keys that look like credentials (`token`, `secret`, `password`, `api_key`,
  …) anywhere in the payload.
- **Forward compatibility.** Unknown top-level or nested keys are ignored so
  producers can add fields without a version bump — except that every key is
  still checked by the no-secrets scan. The version changes when meaning
  changes.

## Document shape

```jsonc
{
  "contract": "mat-console.status/1",   // required, exact
  "generated_at": "2026-09-25T14:20:00Z", // required ISO-8601 *with explicit timezone*
                                          // (Z or ±hh:mm); local times and bare dates rejected
  "ttl_seconds": 3600,                   // optional freshness budget; past it → "stale"
  "project": {                           // required
    "id": "relay",                       // required non-empty
    "name": "Relay",                     // required non-empty
    "summary": "Durable workflow runtime prototype." // optional one-liner
  },
  "source": {                            // optional provenance block
    "label": "github-actions",
    "url": "https://…/status.json",
    "evidence_url": "https://…/runs/140"
  },
  "health": {                            // optional; absent ⇒ "unknown"
    "state": "attention",                // "ok" | "attention" | "degraded" | "unknown"
    "summary": "Two blocked items need review."      // optional sentence
  },
  "progress": {                          // OPTIONAL — omit entirely when unknown
    "percent": 62,                       // number 0–100
    "basis": "9 of 14 acceptance records" // optional free text
  },
  "milestones": [
    {
      "id": "m3",                        // required
      "title": "Durable Execution",      // required
      "state": "current",                // "done" | "current" | "planned" | "blocked"
      "description": "…",                // optional
      "evidence_url": "https://…",       // optional http(s) link
      "updated_at": "2026-09-25T13:00:00Z", // optional
      "evidence_count": { "recorded": 6, "expected": 9 } // optional raw counts
    }
  ],
  "runs": [
    {
      "id": "run-140",                   // required
      "label": "#140",                   // optional display label
      "status": "failed",                // "succeeded"|"failed"|"running"|"cancelled"|"unknown"
      "started_at": "…", "finished_at": "…", // optional ISO-8601
      "evidence_url": "https://…/runs/140"
    }
  ],
  "attention": [
    {
      "id": "a1",                        // required
      "title": "Timeout boundary unverified", // required
      "detail": "…",                     // optional
      "severity": "blocked",             // "info" | "warn" | "blocked"
      "evidence_url": "https://…"
    }
  ]
}
```

Only `contract`, `generated_at`, and `project.{id,name}` are required; a valid
minimal document is five lines.

Timestamps (`generated_at`, `updated_at`, `started_at`, `finished_at`) must be
unambiguous ISO-8601 with an explicit timezone — `2026-09-25T14:20:00Z` or
`+08:00` offsets are valid; `"2026-09-25T14:20:00"`, `"01/02/2026"`, and
nonexistent dates like `2026-02-30` are rejected.

The URL fields the contract defines — `source.url`, `source.evidence_url`,
`milestones[].evidence_url`, `runs[].evidence_url`,
`attention[].evidence_url` — must be `http:`/`https:`. Validation covers the
known fields only: unknown extension fields are ignored (not type- or
URL-checked), except that every key in the document — including extension
fields — is still subject to the no-secrets scan.

## Serving it over HTTP

Serve the JSON with `Content-Type: application/json`. For a **browser-based**
console fetching cross-origin you must also send CORS headers, e.g.
`Access-Control-Allow-Origin: *` for a public read-only document.

The included HTTP adapter (`src/adapters/http.ts`, `?url=` param) does a plain
`GET` with no credentials. Limitations:

- **CORS:** without `Access-Control-Allow-Origin` the browser blocks the read;
  the console shows a fetch error (never "healthy"). There is no proxy.
- **Auth:** only unauthenticated endpoints are expected to work. Static
  `Authorization` headers can be passed to `createHttpAdapter` but are visible
  to anyone viewing the page — do not publish status documents that require
  secrets to read, and never put credentials *in* a document.
- **This adapter only helps projects that already emit `mat-console.status/1`.**
  Projects that don't yet implement the contract need a producer first —
  Vue or server-rendered apps can emit the same JSON without adopting React.

### Minimal producer example

Any static file host or endpoint that returns the JSON works. A minimal
Node/Express-style example (see `docs/examples/express-status.mjs`):

```js
import express from "express";
const app = express();
const status = { /* mat-console.status/1 document */ };
app.get("/status.json", (_req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.type("application/json").send(JSON.stringify(status));
});
app.listen(4173);
```

Or with no server at all — commit a `status.json` generated by CI to a
statically-hosted location (GitHub Pages, an artifact bucket) that already
sends permissive CORS headers.
