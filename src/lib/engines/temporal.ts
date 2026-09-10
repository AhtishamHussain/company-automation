import type { EngineAdapter, EngineHealth, RunWorkflowInput, RunWorkflowResult } from "./types";

const baseUrl = () =>
  process.env.TEMPORAL_UI_URL?.replace(/\/$/, "") || "http://localhost:8088";

async function health(): Promise<EngineHealth> {
  const address = process.env.TEMPORAL_ADDRESS || "localhost:7233";
  const started = Date.now();
  try {
    const bridge = process.env.TEMPORAL_BRIDGE_URL?.replace(/\/$/, "") || "http://localhost:8099";
    if (bridge) {
      const res = await fetch(`${bridge}/health`, { signal: AbortSignal.timeout(4000) });
      if (res.ok) {
        const data = (await res.json()) as { workflows?: number };
        return {
          id: "temporal",
          status: "online",
          latencyMs: Date.now() - started,
          baseUrl: address,
          message: `Bridge online · ${data.workflows ?? "?"} workflows · UI ${baseUrl()}`,
        };
      }
    }
    const res = await fetch(baseUrl(), { signal: AbortSignal.timeout(4000) });
    return {
      id: "temporal",
      status: res.ok ? "degraded" : "offline",
      latencyMs: Date.now() - started,
      baseUrl: address,
      message: res.ok
        ? `UI up but set TEMPORAL_BRIDGE_URL for Run (address ${address})`
        : `UI HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      id: "temporal",
      status: "offline",
      baseUrl: address,
      message: err instanceof Error ? err.message : "unreachable",
    };
  }
}

async function run(input: RunWorkflowInput): Promise<RunWorkflowResult> {
  const bridge = process.env.TEMPORAL_BRIDGE_URL?.replace(/\/$/, "") || "http://localhost:8099";

  try {
    const res = await fetch(`${bridge}/workflows/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workflowType: input.engineWorkflowRef,
        workflowId: `${input.workflowId}-${Date.now()}`,
        args: [input.payload ?? {}],
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        engine: "temporal",
        message: `Temporal start failed: ${res.status} ${text.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as { runId?: string; workflowId?: string };
    return {
      ok: true,
      engine: "temporal",
      runId: data.runId ?? data.workflowId ?? crypto.randomUUID(),
      message: "Durable workflow started on Temporal",
      externalUrl: `${baseUrl()}/namespaces/default/workflows`,
    };
  } catch (err) {
    return {
      ok: false,
      engine: "temporal",
      message: err instanceof Error ? err.message : "Temporal run failed",
    };
  }
}

export const temporalAdapter: EngineAdapter = {
  meta: {
    id: "temporal",
    name: "Temporal",
    tagline: "Durable long-running workflows",
    bestFor: ["Approvals", "Onboarding", "Multi-day processes"],
    defaultUrlEnv: "TEMPORAL_ADDRESS",
    docsUrl: "https://docs.temporal.io/",
  },
  health,
  run,
};
