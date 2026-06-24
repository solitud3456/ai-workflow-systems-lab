import Link from "next/link";
import PageHeader from "@/components/PageHeader";

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

const documentIntakeFeatures = [
  "Document intake",
  "Document status tracking",
  "localStorage persistence",
  "Manual AI extraction prompt",
  "Pasted JSON document analysis",
  "Human review",
  "Key points",
  "Missing information",
  "Action items",
  "Copy action items",
  "Dashboard metrics",
  "Demo management controls",
];

const demoComparison = [
  {
    title: "Lead Follow-up Assistant",
    workflowArea: "Customer follow-up",
    mainInput: "Customer inquiry",
    aiOutput: "Follow-up summary and suggested reply",
    href: "/demos/lead-follow-up",
    linkLabel: "Open lead demo",
  },
  {
    title: "Recruitment Workflow Assistant",
    workflowArea: "Recruitment screening",
    mainInput: "Candidate notes and application text",
    aiOutput: "Candidate screening analysis and interview questions",
    href: "/demos/recruitment-assistant",
    linkLabel: "Open recruitment demo",
  },
  {
    title: "Document Intake Assistant",
    workflowArea: "Document intake",
    mainInput: "Messy document text",
    aiOutput: "Document summary, missing information, and action items",
    href: "/demos/document-intake",
    linkLabel: "Open document demo",
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

        <aside className="mt-8 border-y border-cyan-500/20 py-4 text-sm leading-6 text-slate-400">
          <p>
            <span className="font-semibold text-cyan-200">
              Browser-based prototypes:
            </span>{" "}
            demo data stays in your browser through localStorage. There is no
            account, database, or live AI API yet; manual AI mode means copying
            a prompt into ChatGPT or Claude and pasting the JSON result back
            into the demo.
          </p>
          <p className="mt-2 text-slate-300">
            For a quick test without opening an AI tool, click{" "}
            <span className="font-semibold text-cyan-200">
              Copy sample JSON
            </span>
            , paste it into the AI JSON result box, and save the analysis.
          </p>
        </aside>

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

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            Live working demo
          </span>

          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Document Intake Assistant
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                A manual-AI workflow demo for turning pasted document text into
                structured summaries, key points, missing information, action
                items, and human-reviewed next steps. It uses local browser
                storage and does not imply a production knowledge system or
                live document-processing API.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {documentIntakeFeatures.map((feature) => (
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
              href="/demos/document-intake"
              className="shrink-0 rounded-full border border-cyan-400/60 px-5 py-3 text-center text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
            >
              Open document demo
            </Link>
          </div>
        </section>

        <section className="mt-14 border-t border-slate-800 pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
            Demo comparison
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              What each demo proves
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              Each prototype applies the same manual-AI workflow to a different
              business process, showing reusable system thinking rather than
              isolated AI features.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {demoComparison.map((demo) => (
              <article
                key={demo.title}
                className="flex flex-col rounded-lg border border-slate-800 bg-slate-900/50 p-5"
              >
                <h3 className="text-lg font-semibold text-white">
                  {demo.title}
                </h3>
                <dl className="mt-5 flex-1 space-y-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Workflow area
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-slate-300">
                      {demo.workflowArea}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Main input
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-slate-300">
                      {demo.mainInput}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      AI output
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-slate-300">
                      {demo.aiOutput}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Human review
                    </dt>
                    <dd className="mt-1 text-sm leading-6 text-slate-300">
                      Human approves analysis before using the output.
                    </dd>
                  </div>
                </dl>

                <Link
                  href={demo.href}
                  className="mt-6 w-fit rounded-full border border-cyan-400/40 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                >
                  {demo.linkLabel}
                </Link>
              </article>
            ))}
          </div>

          <p className="mt-10 border-y border-cyan-500/20 py-5 text-center text-sm font-medium leading-6 text-cyan-200">
            Intake &rarr; Status tracking &rarr; AI prompt &rarr; JSON result
            &rarr; Human review &rarr; Copyable output &rarr; Metrics
          </p>
        </section>
      </section>
    </main>
  );
}
