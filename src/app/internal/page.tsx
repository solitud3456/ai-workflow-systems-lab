import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const tools = [
  {
    title: "Command Center",
    description: "Run automation and manage tasks.",
    href: "/internal/task-queue",
  },
  {
    title: "Records",
    description: "Inspect, edit, export, and delete synced records.",
    href: "/internal/demo-records",
  },
  {
    title: "Logs",
    description: "Review automation and record activity.",
    href: "/internal/activity-log",
  },
];

function InternalToolsDisabled() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Internal"
          title="Internal tools are disabled."
          description="Set INTERNAL_TOOLS_ENABLED=true to use development utilities."
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
          >
            Back home
          </Link>
          <Link
            href="/workflow-dashboard"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            View dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function InternalIndexPage() {
  if (process.env.INTERNAL_TOOLS_ENABLED !== "true") {
    return <InternalToolsDisabled />;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Internal"
          title="Internal tools"
          description="Development utilities for automation, records, and logs."
        />

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-cyan-500/50"
            >
              <h2 className="text-lg font-semibold text-white">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
