import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const proofPoints = [
  "Workflow thinking",
  "UI building",
  "Structured AI prompts",
  "JSON-based AI outputs",
  "Human review",
  "Status tracking",
  "Local persistence",
  "Dashboard metrics",
  "Documentation and case studies",
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="About"
          title="A portfolio lab for practical AI workflow systems."
          description="AI Workflow Systems Lab is a learning and building project focused on turning messy business processes into small working prototypes."
        />

        <section className="mt-10 rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-6">
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            Current focus
          </span>
          <h2 className="mt-5 text-2xl font-semibold text-white">
            Build proof through live demos, not fake agency claims.
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            This project is not pretending to be an agency with clients. It is a
            portfolio lab for practicing applied AI workflow design: taking a
            messy process, shaping it into a small interface, adding structured
            AI assistance, saving useful state, and documenting the limits.
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
            The lab now has two working demos. Lead Follow-up Assistant explores
            customer inquiry and follow-up workflows. Recruitment Workflow
            Assistant applies the same practical method to candidate screening,
            interview preparation, and human-reviewed recruiter next steps.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/demos/lead-follow-up"
              className="rounded-full bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open lead demo
            </Link>
            <Link
              href="/demos/recruitment-assistant"
              className="rounded-full border border-cyan-400/60 px-5 py-3 text-center text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
            >
              Open recruitment demo
            </Link>
            <Link
              href="/demos"
              className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              View demos
            </Link>
            <Link
              href="/methods"
              className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Read methods
            </Link>
            <Link
              href="/case-studies"
              className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Read case studies
            </Link>
          </div>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">
              What this lab is for
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              The goal is to learn by building practical AI-assisted workflow
              prototypes: identify a real process, create a usable interface,
              test the structured AI-assisted flow, and explain what works,
              what remains manual, and what should be upgraded next.
            </p>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">
              What the demos prove
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {proofPoints.map((point) => (
                <span
                  key={point}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300"
                >
                  {point}
                </span>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
