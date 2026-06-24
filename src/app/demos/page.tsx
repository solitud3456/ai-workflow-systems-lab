import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";

const leadFollowUpFeatures = [
  "Lead intake",
  "Browser persistence with localStorage",
  "Manual AI prompt generation",
  "Pasted JSON analysis",
  "Human review",
  "Suggested reply copy",
  "Dashboard metrics",
];

const recruitmentFeatures = [
  "Candidate intake",
  "Candidate status tracking",
  "localStorage persistence",
  "Manual AI screening prompt",
  "Pasted JSON candidate analysis",
  "Human review",
  "Interview question suggestions",
  "Copy interview questions",
  "Dashboard metrics",
  "Demo management controls",
];

const futureDemos = [
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
        <PageHeader
          eyebrow="Demos"
          title="Workflow systems, not random AI toys."
          description="Each demo is designed around a real business workflow: messy input, structured records, AI-assisted output, human review, and a clear next action."
        />

        <section className="mt-10 rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-6">
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            First live working demo
          </span>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Lead Follow-up Assistant
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                A portfolio lab demo for turning messy customer inquiries into
                structured lead records, saved AI analysis, human-reviewed next
                steps, and practical follow-up drafts. It keeps the current build
                honest: manual AI mode, browser storage, and no production CRM
                or live AI API implied.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {leadFollowUpFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/demos/lead-follow-up"
                className="rounded-full bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Open demo
              </Link>
              <Link
                href="/case-studies"
                className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Read case study
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            Live working demo
          </span>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Recruitment Workflow Assistant
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                An applied workflow demo for organizing messy candidate notes
                into structured screening summaries, interview questions, and
                human-reviewed recruiter next steps. It uses manual AI
                copy-and-paste and local browser storage, without implying a
                production hiring system or automated hiring decision.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {recruitmentFeatures.map((feature) => (
                  <span
                    key={feature}
                    className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            </div>

            <Link
              href="/demos/recruitment-assistant"
              className="shrink-0 rounded-full border border-cyan-400/60 px-5 py-3 text-center text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
            >
              Open recruitment demo
            </Link>
          </div>
        </section>

        <div className="mt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Future demo ideas
          </p>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {futureDemos.map((demo) => (
              <InfoCard
                key={demo.title}
                title={demo.title}
                description={demo.description}
                tag={demo.status}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
