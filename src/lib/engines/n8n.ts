import type { EngineAdapter, EngineHealth, RunWorkflowInput, RunWorkflowResult } from "./types";

const baseUrl = () =>
  process.env.N8N_BASE_URL?.replace(/\/$/, "") || "http://localhost:5678";

/**
 * Catalog refs look like `master/crm/lead-capture`.
 * Live webhook path: /webhook/master/crm/lead-capture
 */
function webhookUrl(engineWorkflowRef: string) {
  const path = engineWorkflowRef.replace(/^\/+/, "");
  return `${baseUrl()}/webhook/${path}`;
}

async function health(): Promise<EngineHealth> {
  const url = baseUrl();
  const started = Date.now();
  try {
    const res = await fetch(`${url}/healthz`, {
      signal: AbortSignal.timeout(4000),
    });
    return {
      id: "n8n",
      status: res.ok ? "online" : "degraded",
      latencyMs: Date.now() - started,
      baseUrl: url,
      message: res.ok
        ? `n8n online — webhooks at ${url}/webhook/live-...`
        : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      id: "n8n",
      status: "offline",
      baseUrl: url,
      message: err instanceof Error ? err.message : "unreachable",
    };
  }
}

async function runViaWebhook(input: RunWorkflowInput): Promise<RunWorkflowResult> {
  const url = webhookUrl(input.engineWorkflowRef);
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input.payload ?? {}),
    signal: AbortSignal.timeout(20000),
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
      engine: "n8n",
      message: `n8n webhook failed: ${res.status} ${text.slice(0, 200)}`,
      externalUrl: `${baseUrl()}/home/workflows`,
    };
  }

  return {
    ok: parsed.ok !== false,
    engine: "n8n",
    runId: String(parsed.masterWorkflowId || input.workflowId),
    message:
      typeof parsed.message === "string"
        ? parsed.message
        : `n8n webhook ok → ${input.engineWorkflowRef}`,
    externalUrl: `${baseUrl()}/home/workflows`,
  };
}

async function runViaApi(input: RunWorkflowInput): Promise<RunWorkflowResult | null> {
  const key = process.env.N8N_API_KEY;
  if (!key) return null;

  // Optional: if engineWorkflowRef is a numeric/uuid workflow id, execute via API
  if (input.engineWorkflowRef.includes("/")) return null;

  const url = baseUrl();
  const res = await fetch(`${url}/api/v1/workflows/${input.engineWorkflowRef}/execute`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-N8N-API-KEY": key,
    },
    body: JSON.stringify({ data: input.payload ?? {} }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const text = await res.text();
    return {
      ok: false,
      engine: "n8n",
      message: `n8n API execute failed: ${res.status} ${text.slice(0, 200)}`,
    };
  }

  const data = (await res.json()) as { data?: { executionId?: string } };
  return {
    ok: true,
    engine: "n8n",
    runId: data.data?.executionId ?? crypto.randomUUID(),
    message: "Workflow queued on n8n API",
    externalUrl: `${url}/workflow/${input.engineWorkflowRef}`,
  };
}

async function run(input: RunWorkflowInput): Promise<RunWorkflowResult> {
  try {
    const apiResult = await runViaApi(input);
    if (apiResult) return apiResult;
    return await runViaWebhook(input);
  } catch (err) {
    return {
      ok: false,
      engine: "n8n",
      message: err instanceof Error ? err.message : "n8n run failed",
    };
  }
}

export const n8nAdapter: EngineAdapter = {
  meta: {
    id: "n8n",
    name: "n8n",
    tagline: "Visual integration workflows",
    bestFor: ["CRM", "Email / Gmail", "Slack", "WhatsApp"],
    defaultUrlEnv: "N8N_BASE_URL",
    docsUrl: "https://docs.n8n.io/",
  },
  health,
  run,
};
