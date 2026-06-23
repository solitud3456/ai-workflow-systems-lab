import Link from "next/link";
import InfoCard from "@/components/InfoCard";

const leadFollowUpFeatures = [
  "Lead intake",
  "Local browser persistence",
  "Manual AI prompt generation",
  "Pasted JSON analysis",
  "Human review",
  "Suggested reply copy",
  "Dashboard metrics",
];

const futureDemos = [
  {
    title: "HR Workflow Assistant",
    description:
      "A planned workflow demo for candidate records, CV summaries, interview preparation, and onboarding tasks.",
  },
  {
    title: "Document Intake Assistant",
    description:
      "A planned workflow demo for extracted fields, document summaries, checklists, and human-review warnings.",
  },
];

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
          human review, and dashboard-based process improvement. The first live
          working demo is now available: Lead Follow-up Assistant.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/demos/lead-follow-up"
            className="rounded-full bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            Open live demo
          </Link>

          <Link
            href="/demos"
            className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            View demos
          </Link>

          <Link
            href="/case-studies"
            className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            Read case study
          </Link>
        </div>

        <section className="mt-10 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6">
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            First live working demo
          </span>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Lead Follow-up Assistant
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                A practical workflow demo for turning messy customer inquiries
                into structured lead records, manual AI analysis, human-reviewed
                next actions, and reusable reply drafts.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {leadFollowUpFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-cyan-500/20 px-3 py-1 text-xs font-medium text-slate-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/demos/lead-follow-up"
              className="w-fit rounded-full bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Open live demo
            </Link>
          </div>
        </section>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Future demo ideas
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {futureDemos.map((demo) => (
              <InfoCard
                key={demo.title}
                title={demo.title}
                description={demo.description}
                tag="Planned"
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
