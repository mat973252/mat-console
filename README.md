# mat-console

An open source, **read-only** project status console for software and agent
projects — a quiet "project journal" that shows what a project is doing, what
ran recently, and what needs attention.

Palette: ink `#142121`, paper `#FBF9F8`, mint `#83CEBE`. Stack: React 19 +
TypeScript + Vite, Tailwind v4, Storybook. Everything is reported status — the
console never claims to verify it.

## Status of this repository

Stage 1 is implemented and working locally:

- **Contract** — `mat-console.status/1`, a versioned JSON document with a
  runtime validator, TypeScript types, and valid/invalid fixture tests
  (`src/contract/`, spec in `docs/protocol-v1.md`).
- **Overview page** — read-only journal layout rendering the contract through
  an adapter interface, with distinct loading / empty / invalid / failed /
  stale / unknown states.
- **Adapters** — a mock adapter serving clearly-labeled demo data (the default
  demo), and a minimal HTTP adapter for endpoints that already emit the
  contract.
- **Storybook** covering the Overview and every status state.

Not built yet (deliberately): no backend proxy, no auth, no actions of any
kind, no multi-project views, no framework SDKs.

## Quick start

```bash
pnpm install        # Node ≥ 20 (developed on Node 24 / pnpm 11)
pnpm dev            # demo at http://localhost:5173 — mock adapter, demo data
pnpm test           # vitest: contract validator + adapter tests
pnpm typecheck      # tsc --noEmit
pnpm build          # vite build → dist/
pnpm storybook      # Storybook at http://localhost:6006
```

Demo states (all mock data, all labeled):

| URL | State |
|---|---|
| `http://localhost:5173/` | reported project, "attention" health |
| `http://localhost:5173/?demo=stale` | same project past its TTL |
| `http://localhost:5173/?demo=empty` | valid doc, nothing reported |
| `http://localhost:5173/?demo=invalid` | payload fails validation |
| `http://localhost:5173/?demo=fails` | fetch fails → never shown healthy |

Point the console at a real endpoint that emits `mat-console.status/1`:

```
http://localhost:5173/?url=https://your-host/status.json
```

Browser fetches require the endpoint to send CORS headers
(`Access-Control-Allow-Origin`) and to be readable without credentials —
see `docs/protocol-v1.md` for the limits and a minimal producer example
(`docs/examples/express-status.mjs`). Projects that don't emit the contract
yet need a producer first; a Vue or server-rendered app can emit the same JSON
without adopting React.

## Layout

Three project producers are available: Agent Platform, Relay and AgentPermit4j.
See [local integration guide](docs/project-integrations.md) for export commands,
the loopback-only launcher and evidence limits.

```
src/
  contract/    status.ts (types + runtime validator), fixtures/, tests
  adapters/    adapter.ts (interface), mock.ts (demo data), http.ts
  lib/         view.ts (pure derivation: freshness, current milestone, next inspection)
  components/  journal.tsx (presentational), OverviewPage.tsx (load state container)
  stories/     Storybook stories for every state
docs/
  protocol-v1.md           contract spec + HTTP serving notes
  examples/express-status.mjs  minimal producer
```

## Design

The Overview follows `docs/design-v1.md` (concept C, "Project journal"):
paper canvas, serif display heading, milestone timeline beside a ruled
snapshot, mint accent on the current step. The reference image is a visual
target — all content in the demo is fabricated and labeled as such.

## License

MIT. See [LICENSE](LICENSE).
