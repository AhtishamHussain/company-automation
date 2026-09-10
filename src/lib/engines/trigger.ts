import type { EngineAdapter, EngineHealth, RunWorkflowInput, RunWorkflowResult } from "./types";

const baseUrl = () =>
  process.env.TRIGGER_API_URL?.replace(/\/$/, "") || "http://localhost:8092";

function secret() {
  return process.env.TRIGGER_SECRET_KEY || "local";
}

async function health(): Promise<EngineHealth> {
  const url = baseUrl();
  const started = Date.now();
  try {
    const res = await fetch(`${url}/api/v1/whoami`, {
      headers: { Authorization: `Bearer ${secret()}` },
      signal: AbortSignal.timeout(4000),
    });
    return {
      id: "trigger",
      status: res.ok || res.status === 404 ? "online" : "degraded",
      latencyMs: Date.now() - started,
      baseUrl: url,
      message: res.ok
        ? "Trigger.dev bridge online — meeting + proposal tasks"
        : `Auth probe HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      id: "trigger",
      status: "offline",
      baseUrl: url,
      message: err instanceof Error ? err.message : "unreachable",
    };
  }
}

async function run(input: RunWorkflowInput): Promise<RunWorkflowResult> {
  const url = baseUrl();
  try {
    const res = await fetch(`${url}/api/v1/tasks/${input.engineWorkflowRef}/trigger`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret()}`,
      },
      body: JSON.stringify({ payload: input.payload ?? {} }),
      signal: AbortSignal.timeout(25000),
    });

    const text = await res.text();
    let data: Record<string, unknown> = {};
    try {
      data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      data = { raw: text.slice(0, 300) };
    }

    if (!res.ok) {
      return {
        ok: false,
        engine: "trigger",
        message: `Trigger.dev failed: ${res.status} ${text.slice(0, 200)}`,
      };
    }

    return {
      ok: true,
      engine: "trigger",
      runId: String(data.id ?? crypto.randomUUID()),
      message:
        typeof data.message === "string"
          ? data.message
          : "Background task triggered on Trigger.dev",
      externalUrl: url.includes("localhost") ? `${url}/tasks` : "https://cloud.trigger.dev",
    };
  } catch (err) {
    return {
      ok: false,
      engine: "trigger",
      message: err instanceof Error ? err.message : "Trigger.dev run failed",
    };
  }
}

export const triggerAdapter: EngineAdapter = {
  meta: {
    id: "trigger",
    name: "Trigger.dev",
    tagline: "Background jobs for the app layer",
    bestFor: ["Meeting Summary", "Proposal Generator"],
    defaultUrlEnv: "TRIGGER_API_URL",
    docsUrl: "https://trigger.dev/docs",
  },
  health,
  run,
};
