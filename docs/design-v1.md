# Overview design direction: Project journal

The user selected concept C for the first release on 2026-09-25. [Reference image](concept-c.png) is a visual target, not a screenshot of working product or actual Relay status. All values and status shown there are fabricated demo content and must be labeled as such in the running demo.

## Layout and style

- A quiet, paper-like canvas (`#FBF9F8`) with ink typography (`#142121`) and restrained mint accents (`#83CEBE`). Prefer generous whitespace, fine rules, and a readable serif display heading paired with a sans-serif UI font. Avoid an all-dark dashboard or dense metric tiles.
- Desktop Overview: small top bar with project breadcrumb and demo/source badge; project name and one-sentence current-state summary; main two-column body with a chronological milestone timeline on the left and a compact current snapshot on the right.
- Snapshot: reported health/unknown, current milestone, acceptance evidence count if supplied, recent failed run, and blocked attention count. A prominent “what to inspect next” panel points to the most relevant evidence link.
- Timeline rows show explicit state, title, concise description, and optional evidence link. The current step receives the clearest mint accent; past and planned steps stay quieter.
- On narrow screens, stack timeline and snapshot into one column. Keep the source, timestamp, and demo/stale/unknown state visible without horizontal scrolling.

## Trust and interaction rules

- Do not derive a project completion percentage from milestone or task counts. The sample image's `6 / 9` is an acceptance-record count only.
- Use the protocol's source timestamp and evidence URLs when available. Do not imply a link works if no evidence URL is provided.
- Treat failed fetch, invalid payload, missing health signal, and stale data as different UI states. Never show a failed fetch as healthy.
- Keep this stage read-only. Do not add action buttons for approval or operation execution.
- Use accessible contrast, semantic headings, focus styles, and native link/button behavior.

## Acceptance reference

The implementation should preserve the reference's information hierarchy and visual character while using real data fields from the stage-1 protocol. It need not copy the exact prose, project example, or spacing pixel-for-pixel. Provide a desktop and mobile screenshot in the PR for comparison.
