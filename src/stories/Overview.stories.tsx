import type { Meta, StoryObj } from "@storybook/react-vite";
import type { StatusAdapter } from "../adapters/adapter";
import { createMockAdapter } from "../adapters/mock";
import { OverviewPage } from "../components/OverviewPage";

/** Adapter that returns a fixed payload — used only inside stories. */
function staticAdapter(payload: unknown, label = "static fixture"): StatusAdapter {
  return {
    id: "static",
    label,
    isDemo: true,
    async fetchStatus() {
      return { ok: true, payload, fetchedAt: new Date() };
    },
  };
}

/** Adapter that never resolves — keeps the page in the loading state. */
const pendingAdapter: StatusAdapter = {
  id: "pending",
  label: "slow source",
  isDemo: false,
  fetchStatus: () => new Promise(() => {}),
};

const meta: Meta<typeof OverviewPage> = {
  title: "Overview",
  component: OverviewPage,
  parameters: { layout: "fullscreen" },
};
export default meta;

type Story = StoryObj<typeof OverviewPage>;

/** Fabricated demo project via the mock adapter — the default app state. */
export const Demo: Story = {
  args: { adapter: createMockAdapter("demo") },
};

/** Same project reported long past its TTL — the stale badge and banner show. */
export const Stale: Story = {
  args: { adapter: createMockAdapter("stale") },
};

/** Valid document with no milestones, runs, or attention items. */
export const Empty: Story = {
  args: { adapter: createMockAdapter("empty") },
};

/** Payload fails contract validation — shown as unreported, not healthy. */
export const InvalidResponse: Story = {
  args: { adapter: createMockAdapter("invalid") },
};

/** Fetch failure — must never render as healthy. */
export const FetchFailure: Story = {
  args: { adapter: createMockAdapter("fails") },
};

export const Loading: Story = {
  args: { adapter: pendingAdapter },
};

/** Health not reported at all — distinct from "ok" and from stale. */
export const HealthUnknown: Story = {
  args: {
    adapter: staticAdapter({
      contract: "mat-console.status/1",
      generated_at: new Date().toISOString(),
      ttl_seconds: 3600,
      project: { id: "quiet", name: "Quiet Project" },
      source: { label: "static fixture" },
      milestones: [
        { id: "m1", title: "Bootstrap", state: "done" },
        { id: "m2", title: "First milestone", state: "current" },
      ],
    }),
  },
};
