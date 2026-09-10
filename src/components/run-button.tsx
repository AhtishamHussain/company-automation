"use client";

import { useState, useTransition } from "react";
import type { Workflow } from "@/lib/workflows/catalog";

const engineLabel: Record<string, string> = {
  n8n: "n8n",
  kestra: "Kestra",
  temporal: "Temporal",
  activepieces: "ActivePieces",
  trigger: "Trigger.dev",
};

function samplePayload(workflow: Workflow): Record<string, unknown> {
  const base = {
    source: "master-app",
    domain: workflow.category,
    at: new Date().toISOString(),
  };

  switch (workflow.category) {
    case "crm":
      return {
        ...base,
        name: "Ada Lovelace",
        email: "ada@example.com",
        company: "Analytical Engines",
        stage: "new",
      };
    case "email":
      return {
        ...base,
        to: "ada@example.com",
        subject: `Master · ${workflow.name}`,
        tags: ["master", workflow.category],
      };
    case "slack":
      return {
        ...base,
        channel: "#ops",
        text: `Master alert: ${workflow.name}`,
        severity: workflow.id.includes("incident") ? "critical" : "info",
      };
    case "whatsapp":
      return {
        ...base,
        to: "+15555550100",
        text: `Master: ${workflow.name}`,
        locale: "en",
      };
    default:
      return base;
  }
}

export function RunButton({ workflow }: { workflow: Workflow }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  function run() {
    setMsg(null);
    start(async () => {
      const res = await fetch(`/api/workflows/${workflow.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: samplePayload(workflow) }),
      });
      const data = (await res.json()) as {
        ok: boolean;
        message: string;
        demo?: boolean;
        externalUrl?: string;
      };
      setMsg(data.demo ? `Demo · ${data.message}` : data.message);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="rounded-full bg-teal px-4 py-2 text-sm font-semibold text-ink transition hover:bg-teal-deep disabled:opacity-60"
      >
        {pending ? "Running…" : "Run"}
      </button>
      <p className="max-w-[220px] text-right font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-fog">
        {engineLabel[workflow.engine] ?? workflow.engine}
      </p>
      {msg && <p className="max-w-xs text-right text-xs text-fog">{msg}</p>}
    </div>
  );
}
