import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";

const workflowSteps = [
  "Capture a messy customer inquiry as a structured lead record.",
  "Track the lead status, follow-up date, source, and internal notes.",
  "Generate a structured manual AI prompt for the selected lead.",
  "Paste the AI JSON result back into the app.",
  "Save the analysis with summary, urgency, intent, next action, risk note, and suggested reply.",
  "Mark the analysis as human-reviewed before treating it as ready.",
  "Copy the suggested reply for practical follow-up.",
];

const valuePoints = [
  "AI workflow design around a real business process, not a one-off text generator.",
  "Structured outputs that can be saved, reviewed, counted, and reused.",
  "Human-in-the-loop review so AI suggestions stay assistive rather than automatic.",
  "Local persistence with dashboard metrics for saved analyses and reviewed work.",
  "A clear bridge from manual AI usage to future automation.",
];

const limitations = [
  "Manual AI mode only: the user still copies the prompt into ChatGPT or Claude.",
  "LocalStorage only: records stay in the browser and are not shared across devices.",
  "No real database, authentication, CRM, email, or AI API integration yet.",
];

const nextUpgrades = [
  "Database storage for persistent lead records and saved analyses.",
  "Authentication for private user workspaces.",
  "Real CRM, email, website form, or Zalo-style intake integrations.",
  "Automated AI API mode alongside the current manual mode.",
  "Export and reporting for follow-up performance and pipeline review.",
];

const plannedCaseStudies = [
  {
    title: "HR Workflow Assistant",
    status: "Planned",
    problem:
      "HR teams need to organize candidate information, summarize CVs, prepare interviews, and track onboarding without letting AI make final hiring decisions.",
    proof:
      "This case study will show how AI can assist HR operations while keeping human decision-making in control.",
  },
  {
    title: "Document Intake Assistant",
    status: "Planned",
    problem:
      "Teams often receive messy documents and need summaries, extracted fields, checklists, and source-grounded review.",
    proof:
      "This case study will show document processing with source snippets, uncertainty warnings, and human approval.",
  },
];

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Case Studies"
          title="Proof of workflow thinking, not just screenshots."
          description="Each case study explains the business problem, manual process, AI-assisted workflow, data model, human review pattern, limitations, and future automation path."
        />

        <article className="mt-10">
          <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  Portfolio lab case study
                </span>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white">
                  Lead Follow-up Assistant
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                  This demo explores how a small business could turn scattered
                  customer inquiries into structured lead records, AI-assisted
                  analysis, human-reviewed replies, and visible follow-up status
                  without pretending there is a live AI or production CRM behind it.
                </p>
              </div>

              <Link
                href="/demos/lead-follow-up"
                className="w-fit rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Open live demo
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Problem</h3>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Small businesses receive messy customer inquiries from website
                forms, Facebook messages, email, Zalo, referrals, and other
                informal channels. The important details are often mixed into
                free text, follow-ups can be forgotten, and reply quality depends
                on who happens to respond.
              </p>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Why it matters</h3>
              <ul className="mt-3 space-y-3">
                {valuePoints.map((point) => (
                  <li key={point} className="text-sm leading-6 text-slate-400">
                    {point}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section className="mt-8">
            <h3 className="text-lg font-semibold text-white">Workflow</h3>
            <ol className="mt-4 grid gap-3 md:grid-cols-2">
              {workflowSteps.map((step, index) => (
                <li
                  key={step}
                  className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm leading-6 text-slate-300"
                >
                  <span className="mr-2 font-semibold text-cyan-300">
                    {index + 1}.
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <div className="mt-5 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">
                Current limitation
              </h3>
              <ul className="mt-3 space-y-3">
                {limitations.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
              <h3 className="text-lg font-semibold text-white">Next upgrades</h3>
              <ul className="mt-3 space-y-3">
                {nextUpgrades.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </article>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {plannedCaseStudies.map((study) => (
            <InfoCard
              key={study.title}
              title={study.title}
              tag={study.status}
              description={`${study.problem} Portfolio proof: ${study.proof}`}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
