import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { EngineConstellation } from "@/components/engine-constellation";
import { categories, workflows } from "@/lib/workflows/catalog";
import { listEngines } from "@/lib/engines/registry";

export default function HomePage() {
  const engines = listEngines();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      {/* Hero — one composition */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div className="absolute inset-0">
          <EngineConstellation />
        </div>
        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-6 pb-16 pt-28 sm:pb-20">
          <p className="animate-rise font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-snow sm:text-7xl md:text-8xl">
            Master
          </p>
          <h1 className="animate-rise-delay-1 mt-4 max-w-xl font-[family-name:var(--font-display)] text-2xl font-medium leading-snug text-snow sm:text-3xl">
            Company automation on five engines.
          </h1>
          <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-fog sm:text-lg">
            Route HR, CRM, invoices, messaging, and AI jobs through n8n, Kestra,
            Temporal, ActivePieces, and Trigger.dev — one catalog,{" "}
            {workflows.length} workflows.
          </p>
          <div className="animate-rise-delay-2 mt-8 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="rounded-full bg-teal px-6 py-3 text-sm font-semibold text-ink transition hover:bg-teal-deep"
            >
              Open app console
            </Link>
            <Link
              href="/setup"
              className="rounded-full border border-line px-6 py-3 text-sm font-medium text-snow transition hover:border-teal hover:text-teal"
            >
              Step-by-step guide
            </Link>
          </div>
        </div>
      </section>

      {/* Domains */}
      <section className="border-t border-line bg-ink-2 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
            Every company domain
          </h2>
          <p className="mt-3 max-w-lg text-fog">
            Twelve domains. Each workflow is pinned to the engine that fits it
            best.
          </p>
          <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/workflows?category=${c.id}`}
                className="group border-b border-line pb-4 transition hover:border-teal"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-[family-name:var(--font-display)] text-lg font-medium text-snow group-hover:text-teal">
                    {c.name}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-fog">
                    {c.preferredEngine}
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-fog">{c.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Engines strip */}
      <section className="border-t border-line px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight sm:text-4xl">
            Built on the stack you chose
          </h2>
          <p className="mt-3 max-w-lg text-fog">
            Master does not replace these tools — it orchestrates them.
          </p>
          <div className="mt-10 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {engines.map((e) => (
              <article key={e.id} className="border-l-2 border-teal/40 pl-4">
                <h3 className="font-[family-name:var(--font-display)] text-xl font-medium">
                  {e.name}
                </h3>
                <p className="mt-2 text-sm text-fog">{e.tagline}</p>
                <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-amber">
                  {e.bestFor.join(" · ")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-line px-6 py-8 text-sm text-fog">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
          <span className="font-[family-name:var(--font-display)] text-snow">Master</span>
          <span>{workflows.length} workflows · 5 engines · company automation</span>
        </div>
      </footer>
    </div>
  );
}
