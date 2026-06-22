const demos = [
  {
    title: "Lead Follow-up Assistant",
    status: "Builds first",
    description:
      "A workflow demo for turning customer inquiries into structured lead records, reply drafts, urgency scores, and follow-up actions.",
  },
  {
    title: "HR Workflow Assistant",
    status: "Planned",
    description:
      "A workflow demo for organizing candidate records, CV summaries, interview preparation, and onboarding checklists.",
  },
  {
    title: "Document Intake Assistant",
    status: "Planned",
    description:
      "A workflow demo for extracting fields, summarizing documents, creating checklists, and supporting human review.",
  },
];

export default function DemosPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-400">
          Demos
        </p>

        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Workflow systems, not random AI toys.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Each demo is designed around a real business workflow: messy input,
          structured records, AI-assisted output, human review, and a clear
          next action.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {demos.map((demo) => (
            <article
              key={demo.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                {demo.status}
              </span>
              <h2 className="mt-5 text-xl font-semibold text-white">
                {demo.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {demo.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}