import type { EngineAdapter, EngineHealth, RunWorkflowInput, RunWorkflowResult } from "./types";

const baseUrl = () =>
  process.env.KESTRA_BASE_URL?.replace(/\/$/, "") || "http://localhost:8080";

const tenant = () => process.env.KESTRA_TENANT || "main";

function authHeaders(): HeadersInit {
  const token = process.env.KESTRA_API_TOKEN;
  if (token) return { Authorization: `Bearer ${token}` };
  const user = process.env.KESTRA_USERNAME || "admin@master.local";
  const pass = process.env.KESTRA_PASSWORD || "MasterKestra1";
  return { Authorization: `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}` };
}

async function health(): Promise<EngineHealth> {
  const url = baseUrl();
  const started = Date.now();
  try {
    const res = await fetch(`${url}/api/v1/${tenant()}/flows/search?size=1`, {
      signal: AbortSignal.timeout(4000),
      headers: authHeaders(),
    });
    return {
      id: "kestra",
      status: res.ok ? "online" : "degraded",
      latencyMs: Date.now() - started,
      baseUrl: url,
      message: res.ok
        ? "Kestra online — Master domains company.invoice / company.kb / company.docs"
        : `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      id: "kestra",
      status: "offline",
      baseUrl: url,
      message: err instanceof Error ? err.message : "unreachable",
    };
  }
}

/**
 * engineWorkflowRef: company.invoice/master#invoice_generate
 */
function parseRef(ref: string): { namespace: string; flowId: string; workflowKey: string } {
  const [base, hashKey] = ref.split("#");
  const parts = base.split("/");
  const namespace = parts[0] || "company.invoice";
  const flowId = parts[1] || "master";
  const workflowKey = hashKey || "invoice_generate";
  return { namespace, flowId, workflowKey };
}

async function run(input: RunWorkflowInput): Promise<RunWorkflowResult> {
  const url = baseUrl();
  const { namespace, flowId, workflowKey } = parseRef(input.engineWorkflowRef);
  const payload = input.payload ?? {};

  const form = new FormData();
  form.set("workflow_key", workflowKey);
  form.set("payload", JSON.stringify(payload));
  form.set("dry_run", String(payload.dry_run ?? true));
  if (typeof payload.callback_url === "string") {
    form.set("callback_url", payload.callback_url);
  }

  try {
    const res = await fetch(
      `${url}/api/v1/${tenant()}/executions/${encodeURIComponent(namespace)}/${encodeURIComponent(flowId)}`,
      {
        method: "POST",
        headers: authHeaders(),
        body: form,
        signal: AbortSignal.timeout(20000),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      return {
        ok: false,
        engine: "kestra",
        message: `Kestra execute failed: ${res.status} ${text.slice(0, 220)}`,
        externalUrl: `${url}/ui/flows/${namespace}/${flowId}`,
      };
    }

    const data = (await res.json()) as { id?: string };
    return {
      ok: true,
      engine: "kestra",
      runId: data.id ?? crypto.randomUUID(),
      message: `Kestra ${namespace}/${flowId} started (${workflowKey})`,
      externalUrl: `${url}/ui/executions`,
    };
  } catch (err) {
    return {
      ok: false,
      engine: "kestra",
      message: err instanceof Error ? err.message : "Kestra run failed",
    };
  }
}

export const kestraAdapter: EngineAdapter = {
  meta: {
    id: "kestra",
    name: "Kestra",
    tagline: "Declarative data & ops orchestration",
    bestFor: ["Invoice", "Knowledge Base", "Document Parsing"],
    defaultUrlEnv: "KESTRA_BASE_URL",
    docsUrl: "https://kestra.io/docs",
  },
  health,
  run,
};
