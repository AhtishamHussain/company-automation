"use client";

import { useMemo, useState, useTransition } from "react";
import type { Category, Workflow } from "@/lib/workflows/catalog";
import type { EngineId } from "@/lib/engines/types";

const engineLabels: Record<EngineId, string> = {
  n8n: "n8n",
  kestra: "Kestra",
  temporal: "Temporal",
  activepieces: "ActivePieces",
  trigger: "Trigger.dev",
};

export function WorkflowCatalog({
  categories,
  workflows,
  initialCategory,
  initialEngine,
}: {
  categories: Category[];
  workflows: Workflow[];
  initialCategory?: string;
  initialEngine?: string;
}) {
  const [category, setCategory] = useState(initialCategory || "all");
  const [engine, setEngine] = useState<string>(initialEngine || "all");
  const [q, setQ] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const query = q.toLowerCase().trim();
    return workflows.filter((w) => {
      if (category !== "all" && w.category !== category) return false;
      if (engine !== "all" && w.engine !== engine) return false;
      if (!query) return true;
      return (
        w.name.toLowerCase().includes(query) ||
        w.description.toLowerCase().includes(query) ||
        w.id.includes(query)
      );
    });
  }, [workflows, category, engine, q]);

  function runWorkflow(id: string) {
    setRunningId(id);
    setToast(null);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/workflows/${id}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: { source: "master-ui" } }),
        });
        const data = (await res.json()) as { ok: boolean; message: string };
        setToast(data.message);
      } catch (err) {
        setToast(err instanceof Error ? err.message : "Run failed");
      } finally {
        setRunningId(null);
      }
    });
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex flex-col gap-6 border-b border-line pb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
            Workflow catalog
          </h1>
          <p className="mt-2 text-fog">
            {filtered.length} of {workflows.length} workflows
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search workflows"
            className="min-w-[200px] flex-1 rounded-full border border-line bg-ink-2 px-4 py-2.5 text-sm text-snow outline-none placeholder:text-fog/70 focus:border-teal"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-line bg-ink-2 px-4 py-2.5 text-sm text-snow outline-none focus:border-teal"
          >
            <option value="all">All domains</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={engine}
            onChange={(e) => setEngine(e.target.value)}
            className="rounded-full border border-line bg-ink-2 px-4 py-2.5 text-sm text-snow outline-none focus:border-teal"
          >
            <option value="all">All engines</option>
            {(Object.keys(engineLabels) as EngineId[]).map((id) => (
              <option key={id} value={id}>
                {engineLabels[id]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {toast && (
        <div className="mt-6 rounded-xl border border-line bg-panel px-4 py-3 text-sm text-snow">
          {toast}
        </div>
      )}

      <ul className="mt-8 divide-y divide-line">
        {filtered.map((w) => (
          <li
            key={w.id}
            className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-[family-name:var(--font-display)] text-lg font-medium text-snow">
                  {w.name}
                </h2>
                <span className="rounded-full border border-line px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-fog">
                  {engineLabels[w.engine]}
                </span>
                <span className="rounded-full border border-line px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-amber">
                  {w.trigger}
                </span>
              </div>
              <p className="mt-1 text-sm text-fog">{w.description}</p>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-fog/70">
                {w.id} → {w.engineWorkflowRef}
              </p>
            </div>
            <button
              type="button"
              onClick={() => runWorkflow(w.id)}
              disabled={pending && runningId === w.id}
              className="shrink-0 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-teal-deep disabled:opacity-60"
            >
              {runningId === w.id ? "Running…" : "Run"}
            </button>
          </li>
        ))}
      </ul>

      {filtered.length === 0 && (
        <p className="py-16 text-center text-fog">No workflows match these filters.</p>
      )}
    </div>
  );
}
