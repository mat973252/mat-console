import { useMemo } from "react";
import type { StatusAdapter } from "./adapters/adapter";
import { createHttpAdapter } from "./adapters/http";
import { createMockAdapter, type MockVariant } from "./adapters/mock";
import { OverviewPage } from "./components/OverviewPage";

const MOCK_VARIANTS: MockVariant[] = ["demo", "stale", "empty", "invalid", "fails"];

/**
 * Adapter selection via URL params:
 *   /                       → mock adapter, demo variant
 *   /?demo=stale|empty|invalid|fails → mock adapter, other variants
 *   /?url=https://host/status.json  → http adapter (CORS rules apply)
 */
function pickAdapter(): StatusAdapter {
  const params = new URLSearchParams(window.location.search);
  const url = params.get("url");
  if (url) return createHttpAdapter({ url });
  const demo = params.get("demo");
  if (demo && MOCK_VARIANTS.includes(demo as MockVariant)) {
    return createMockAdapter(demo as MockVariant);
  }
  return createMockAdapter("demo");
}

export default function App() {
  const adapter = useMemo(pickAdapter, []);
  return <OverviewPage adapter={adapter} />;
}
