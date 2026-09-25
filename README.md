# mat-console

An open source project console for seeing what a software project does, what is running, and what needs attention.

This repository is at the initial scaffold stage. The first implementation will define a small, versioned project status document and render it in a read-only React overview. The intended visual palette is ink `#142121`, paper `#FBF9F8`, and mint `#83CEBE`.

## First milestone

- A documented, validated project status payload with explicit timestamps and evidence links.
- A read-only overview showing milestones, health, recent runs, and items needing attention.
- A mock adapter and a working demo that can be run locally without credentials.
- Clear empty, loading, invalid, and stale data states.

The console must distinguish reported status from verified evidence. It must not invent progress percentages, completed tasks, or system health.

## Planned direction

Later milestones may add tasks, events, artifacts, metrics, and agent-specific views after the initial contract and overview are tested with a real project. Existing Vue or server-rendered projects can expose the protocol without adopting the React UI.

## License

MIT. See [LICENSE](LICENSE).
