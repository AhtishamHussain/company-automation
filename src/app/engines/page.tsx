import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { healthAll, listEngines } from "@/lib/engines/registry";
import { workflowsByEngine } from "@/lib/workflows/catalog";
import type { EngineStatus } from "@/lib/engines/types";

const statusColor: Record<EngineStatus, string> = {
  online: "text-teal",
  degraded: "text-amber",
  offline: "text-red-400",
  unconfigured: "text-fog",
};

export default async function EnginesPage() {
  const [meta, health] = await Promise.all([
    Promise.resolve(listEngines()),
    healthAll(),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader solid />
      <div className="mx-auto w-full max-w-6xl px-6 py-10">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
          Engines
        </h1>
        <p className="mt-2 max-w-xl text-fog">
          Master routes workflows to these backends. Configure env vars, then
          health checks light up. Follow{" "}
          <Link href="/setup" className="text-teal hover:underline">
            the setup guide
          </Link>{" "}
          in order.
        </p>

        <div className="mt-10 space-y-6">
          {meta.map((engine) => {
            const h = health.find((x) => x.id === engine.id);
            const count = workflowsByEngine(engine.id).length;
            return (
              <article
                key={engine.id}
                className="border border-line bg-panel/40 px-5 py-5 sm:px-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium">
                      {engine.name}
                    </h2>
                    <p className="mt-1 text-sm text-fog">{engine.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider ${statusColor[h?.status ?? "unconfigured"]}`}
                    >
                      {h?.status ?? "unconfigured"}
                      {h?.latencyMs != null ? ` · ${h.latencyMs}ms` : ""}
                    </p>
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-fog">
                      {count} workflows
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-fog">{h?.message}</p>
                <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-amber">
                  {engine.bestFor.join(" · ")}
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <Link
                    href={`/workflows?engine=${engine.id}`}
                    className="text-teal hover:underline"
                  >
                    View workflows
                  </Link>
                  <a
                    href={engine.docsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-fog hover:text-snow"
                  >
                    Docs
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
