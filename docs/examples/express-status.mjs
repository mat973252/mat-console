/**
 * Minimal mat-console.status/1 producer (Express example).
 *
 *   npm i express
 *   node express-status.mjs        # serves http://localhost:4173/status.json
 *   pnpm dev                       # then open http://localhost:5173/?url=http://localhost:4173/status.json
 *
 * Any HTTP server or static file host that returns the same JSON with
 * `Access-Control-Allow-Origin` works equally well.
 */
import express from "express";

const status = {
  contract: "mat-console.status/1",
  generated_at: new Date().toISOString(),
  ttl_seconds: 3600,
  project: {
    id: "my-service",
    name: "My Service",
    summary: "Example producer for the mat-console status contract.",
  },
  source: {
    label: "express example",
    url: "http://localhost:4173/status.json",
  },
  health: { state: "ok", summary: "All reported checks passing." },
  milestones: [
    { id: "m1", title: "Emit status document", state: "done" },
    { id: "m2", title: "Serve it with CORS", state: "current" },
  ],
  runs: [
    {
      id: "run-1",
      label: "local",
      status: "succeeded",
      started_at: new Date().toISOString(),
    },
  ],
  attention: [],
};

const app = express();
app.get("/status.json", (_req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.type("application/json").send(JSON.stringify(status));
});
app.listen(4173, () => {
  console.log("status at http://localhost:4173/status.json");
});
