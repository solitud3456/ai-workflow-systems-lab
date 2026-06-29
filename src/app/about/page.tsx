import Link from "next/link";
import PageHeader from "@/components/PageHeader";

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="About"
          title="A practical AI workflow portfolio lab"
          description="This is a solo learning/building project, not an agency or production SaaS claim."
        />

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            What the project is
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            AI Workflow Systems Lab explores how messy business inputs can
            become structured records, reviewed AI assistance, and practical
            next steps. The current proof is multiple live demos plus internal
            tools for synced records, tasks, automation runs, and activity logs.
          </p>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/workflow-dashboard"
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            View dashboard
          </Link>
          <Link
            href="/demos"
            className="rounded-full border border-cyan-400/50 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
          >
            View demos
          </Link>
          <a
            href="https://github.com/solitud3456/ai-workflow-systems-lab"
            target="_blank"
            rel="noreferrer"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            GitHub repo
          </a>
        </div>
      </section>
    </main>
  );
}
