import Link from "next/link";

export function SiteHeader({ solid = false }: { solid?: boolean }) {
  return (
    <header className={solid ? "relative z-20 border-b border-line bg-ink-2" : "absolute inset-x-0 top-0 z-20"}>
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight text-snow"
        >
          Master
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-4 text-sm text-fog sm:gap-6">
          <Link href="/app" className="transition hover:text-snow">
            App
          </Link>
          <Link href="/workflows" className="transition hover:text-snow">
            Workflows
          </Link>
          <Link href="/engines" className="transition hover:text-snow">
            Engines
          </Link>
          <Link href="/setup" className="transition hover:text-snow">
            Setup guide
          </Link>
          <Link
            href="/app"
            className="rounded-full bg-teal px-4 py-2 font-medium text-ink transition hover:bg-teal-deep"
          >
            Open console
          </Link>
        </nav>
      </div>
    </header>
  );
}
