import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { RunButton } from "@/components/run-button";
import {
  categories,
  type CategoryId,
  workflowsByCategory,
} from "@/lib/workflows/catalog";
import { listRunsByCategory } from "@/lib/runs/store";

export const dynamic = "force-dynamic";

const engineUi: Record<string, { label: string; href?: string }> = {
  n8n: { label: "n8n", href: "http://localhost:5678" },
  kestra: { label: "Kestra", href: "http://localhost:8080" },
  temporal: { label: "Temporal", href: "http://localhost:8088" },
  activepieces: { label: "ActivePieces", href: "http://localhost:8091/flows" },
  trigger: { label: "Trigger.dev", href: "http://localhost:8092/tasks" },
};

export default async function DomainDeskPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const category = categories.find((c) => c.id === domain);
  if (!category) notFound();

  const items = workflowsByCategory(domain as CategoryId);
  const runs = listRunsByCategory(domain as CategoryId, 8);
  const engine = engineUi[category.preferredEngine];

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader solid />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <Link href="/app" className="text-sm text-fog hover:text-teal">
          ← All domains
        </Link>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
              {category.name}
            </h1>
            <p className="mt-2 max-w-xl text-fog">{category.description}</p>
          </div>
          <div className="text-right">
            <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-amber">
              Preferred engine
            </p>
            {engine?.href ? (
              <a
                href={engine.href}
                target="_blank"
                rel="noreferrer"
                className="font-[family-name:var(--font-display)] text-lg text-teal hover:underline"
              >
                {engine.label} ↗
              </a>
            ) : (
              <p className="font-[family-name:var(--font-display)] text-lg">{engine?.label}</p>
            )}
          </div>
        </div>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium">
            Workflows in this desk ({items.length})
          </h2>
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {items.map((w) => (
              <li
                key={w.id}
                className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-lg text-snow">
                    {w.name}
                  </h3>
                  <p className="mt-1 text-sm text-fog">{w.description}</p>
                  <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-fog/70">
                    {w.trigger} · {w.engineWorkflowRef}
                  </p>
                </div>
                <RunButton workflow={w} />
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium">
            Recent {category.name} runs
          </h2>
          {runs.length === 0 ? (
            <p className="mt-3 text-sm text-fog">No runs in this domain yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-line border-t border-line">
              {runs.map((r) => (
                <li key={r.id} className="flex justify-between gap-3 py-3 text-sm">
                  <span>{r.workflowName}</span>
                  <span className="font-[family-name:var(--font-mono)] text-xs text-fog">
                    {r.demo ? "demo · " : ""}
                    {new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19)} UTC
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
