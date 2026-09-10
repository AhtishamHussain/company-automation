import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { categories, workflows } from "@/lib/workflows/catalog";
import { listRuns } from "@/lib/runs/store";
import { listEngines } from "@/lib/engines/registry";

export const dynamic = "force-dynamic";

export default function AppConsolePage() {
  const runs = listRuns(12);
  const engines = listEngines();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader solid />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-teal">
          Company automation
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
          Operations console
        </h1>
        <p className="mt-3 max-w-2xl text-fog">
          This is the application where the 100 workflows are used. Open a
          domain desk, run a workflow, and Master routes it to n8n, Kestra,
          Temporal, ActivePieces, or Trigger.dev.
        </p>

        <section className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl font-medium">
            Domain desks
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => {
              const count = workflows.filter((w) => w.category === c.id).length;
              return (
                <Link
                  key={c.id}
                  href={`/app/${c.id}`}
                  className="border border-line bg-panel/30 px-4 py-4 transition hover:border-teal"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-[family-name:var(--font-display)] text-lg text-snow">
                      {c.name}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-fog">
                      {count}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-fog">{c.description}</p>
                  <p className="mt-3 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-amber">
                    via {c.preferredEngine}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-14 grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-medium">
              Recent runs
            </h2>
            {runs.length === 0 ? (
              <p className="mt-4 text-sm text-fog">
                No runs yet. Open a domain desk and click Run.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-line border-t border-line">
                {runs.map((r) => (
                  <li key={r.id} className="py-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm text-snow">{r.workflowName}</span>
                      <span
                        className={`font-[family-name:var(--font-mono)] text-[10px] uppercase ${r.ok ? "text-teal" : "text-red-400"}`}
                      >
                        {r.demo ? "demo" : r.ok ? "ok" : "fail"}
                      </span>
                    </div>
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-fog">
                      {r.engine} · {new Date(r.createdAt).toISOString().replace("T", " ").slice(0, 19)} UTC
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl font-medium">
              Engines in use
            </h2>
            <ul className="mt-4 space-y-3">
              {engines.map((e) => (
                <li key={e.id} className="border-l-2 border-teal/40 pl-3">
                  <p className="font-[family-name:var(--font-display)] text-snow">
                    {e.name}
                  </p>
                  <p className="text-sm text-fog">{e.tagline}</p>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-wrap gap-3 text-sm">
              <Link href="/setup" className="text-teal hover:underline">
                Step-by-step setup guide
              </Link>
              <a
                href="http://localhost:5678"
                target="_blank"
                rel="noreferrer"
                className="text-fog hover:text-snow"
              >
                Open n8n
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
