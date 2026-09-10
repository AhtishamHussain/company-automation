import type { EngineAdapter, EngineHealth, RunWorkflowInput, RunWorkflowResult } from "./types";

const baseUrl = () =>
  process.env.ACTIVEPIECES_BASE_URL?.replace(/\/$/, "") || "http://localhost:8091";

function authHeaders(): HeadersInit {
  const key = process.env.ACTIVEPIECES_API_KEY || "local";
  return { Authorization: `Bearer ${key}` };
}

async function health(): Promise<EngineHealth> {
  const url = baseUrl();
  const started = Date.now();
  try {
    const res = await fetch(`${url}/api/v1/flags`, {
      signal: AbortSignal.timeout(4000),
      headers: authHeaders(),
    });
    return {
      id: "activepieces",
      status: res.ok ? "online" : "degraded",
      latencyMs: Date.now() - started,
      baseUrl: url,
      message: res.ok
        ? "ActivePieces bridge online — recruitment + support webhooks"
        : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      id: "activepieces",
      status: "offline",
      baseUrl: url,
      message: err instanceof Error ? err.message : "unreachable",
    };
  }
}

async function run(input: RunWorkflowInput): Promise<RunWorkflowResult> {
  const url = baseUrl();
  try {
    const res = await fetch(`${url}/api/v1/webhooks/${input.engineWorkflowRef}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders(),
      },
      body: JSON.stringify(input.payload ?? {}),
      signal: AbortSignal.timeout(15000),
    });

    const text = await res.text();
    let parsed: Record<string, unknown> = {};
    try {
      parsed = text ? (JSON.parse(text) as Record<string, unknown>) : {};
    } catch {
      parsed = { raw: text.slice(0, 300) };
    }

    if (!res.ok) {
      return {
        ok: false,
        engine: "activepieces",
        message: `ActivePieces trigger failed: ${res.status} ${text.slice(0, 200)}`,
      };
    }

    return {
      ok: true,
      engine: "activepieces",
      runId: String(parsed.id || crypto.randomUUID()),
      message:
        typeof parsed.message === "string"
          ? parsed.message
          : "Flow triggered on ActivePieces",
      externalUrl: `${url}/flows`,
    };
  } catch (err) {
    return {
      ok: false,
      engine: "activepieces",
      message: err instanceof Error ? err.message : "ActivePieces run failed",
    };
  }
}

export const activepiecesAdapter: EngineAdapter = {
  meta: {
    id: "activepieces",
    name: "ActivePieces",
    tagline: "No-code pieces & business automations",
    bestFor: ["Recruitment", "Customer Support"],
    defaultUrlEnv: "ACTIVEPIECES_BASE_URL",
    docsUrl: "https://www.activepieces.com/docs",
  },
  health,
  run,
};
