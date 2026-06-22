import Link from "next/link";
export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-20">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          AI Workflow Systems Lab
        </p>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
          Practical AI workflow demos for messy business tasks.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          A solo-built portfolio lab showing how AI can support real workflows:
          lead follow-up, HR operations, document intake, structured outputs,
          human review, and dashboard-based process improvement.
        </p>
<div className="mt-10 flex flex-col gap-3 sm:flex-row">
  <Link
    href="/demos"
    className="rounded-full bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
  >
    View workflow demos
  </Link>

  <Link
    href="/methods"
    className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
  >
    See methods
  </Link>
</div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">
              Lead Follow-up Assistant
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Turn customer inquiries into summaries, reply drafts, follow-up
              actions, and pipeline status.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">
              HR Workflow Assistant
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Organize candidate data, CV summaries, interview preparation, and
              onboarding tasks.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <h2 className="text-lg font-semibold text-white">
              Document Intake Assistant
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Extract fields, summarize documents, generate checklists, and show
              human-review warnings.
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
          <h2 className="text-lg font-semibold text-cyan-200">
            Current build phase
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Phase 1: building the static portfolio shell before adding complex
            demos or AI features.
          </p>
        </div>
      </section>
    </main>
  );
}