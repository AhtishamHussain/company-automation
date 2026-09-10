import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { implementationSteps } from "@/lib/setup/steps";

const statusStyle = {
  done: "text-teal border-teal/40",
  in_progress: "text-amber border-amber/40",
  next: "text-snow border-line",
  later: "text-fog border-line",
} as const;

const statusLabel = {
  done: "Done",
  in_progress: "In progress",
  next: "Do next",
  later: "Later",
} as const;

export default function SetupPage() {
  const done = implementationSteps.filter((s) => s.status === "done").length;
  const total = implementationSteps.length;

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader solid />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-teal">
          Implementation guide
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl font-semibold tracking-tight">
          Build Master step by step
        </h1>
        <p className="mt-3 text-fog">
          Follow these phases in order.{" "}
          <span className="text-snow">
            {done}/{total} steps complete
          </span>
          . Start at{" "}
          <Link href="/app" className="text-teal hover:underline">
            the app console
          </Link>{" "}
          once Phase 1–2 are green.
        </p>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-panel">
          <div
            className="h-full bg-teal"
            style={{ width: `${Math.round((done / total) * 100)}%` }}
          />
        </div>

        <ol className="mt-12 space-y-10">
          {implementationSteps.map((step, index) => (
            <li key={step.id} className="border-l-2 border-line pl-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-[family-name:var(--font-mono)] text-xs text-fog">
                  Phase {step.phase} · Step {index + 1}
                </span>
                <span
                  className={`rounded-full border px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider ${statusStyle[step.status]}`}
                >
                  {statusLabel[step.status]}
                </span>
              </div>
              <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl font-medium text-snow">
                {step.title}
              </h2>
              <p className="mt-2 text-fog">{step.summary}</p>
              <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-snow/90">
                {step.how.map((line) => (
                  <li key={line} className="leading-relaxed">
                    {line}
                  </li>
                ))}
              </ol>
              {step.urls && step.urls.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  {step.urls.map((u) => (
                    <Link
                      key={u.href}
                      href={u.href}
                      className="text-teal hover:underline"
                      {...(u.href.startsWith("http")
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                    >
                      {u.label}
                    </Link>
                  ))}
                </div>
              )}
              <p className="mt-4 font-[family-name:var(--font-mono)] text-xs text-amber">
                Done when: {step.doneWhen}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-16 border border-line bg-panel/40 px-5 py-5">
          <h3 className="font-[family-name:var(--font-display)] text-lg">
            What you should do right now
          </h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-fog">
            <li>
              Open{" "}
              <Link href="/app" className="text-teal hover:underline">
                /app
              </Link>{" "}
              and run a CRM, WhatsApp, or Gmail/Email workflow (engines work without SaaS tokens).
            </li>
            <li>
              Open{" "}
              <a
                href="http://localhost:5678"
                className="text-teal hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                n8n
              </a>{" "}
              and inspect the imported Master · workflows.
            </li>
            <li>
              Create an n8n API key and set <code className="text-snow">N8N_API_KEY</code>{" "}
              in <code className="text-snow">.env</code> (Step: Connect Master → n8n).
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
}
