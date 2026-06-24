import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const methods = [
  {
    title: "Workflow-first design",
    description:
      "Start with a messy real-world business process, then break it into intake, status tracking, AI assistance, human review, and follow-up action.",
  },
  {
    title: "Manual AI mode first",
    description:
      "Avoid paid API integration at the start. Generate structured prompts, ask for strict JSON output, and paste the result back into the app so the workflow can be tested before backend complexity.",
  },
  {
    title: "Human-in-the-loop review",
    description:
      "Treat AI suggestions as drafts, not final truth. Both live demos track whether saved analysis has been human-reviewed before a reply, interview question, or next step is used.",
  },
  {
    title: "Small persistent prototypes",
    description:
      "Use localStorage first to prove the workflow with saved records, analysis state, and dashboard metrics before adding Supabase, database storage, or authentication.",
  },
  {
    title: "Portfolio proof",
    description:
      "Every demo should explain the problem, workflow, current limitation, and next upgrades. The project is presented as an applied AI workflow systems lab, not a fake agency.",
  },
];

const sharedPattern = [
  "Messy intake",
  "Status tracking",
  "Manual AI prompt generation",
  "Strict JSON output",
  "Pasted AI analysis",
  "Human review",
  "Copyable next-step output",
  "Dashboard metrics",
  "localStorage persistence",
];

const whyItMatters = [
  "AI supports the workflow without replacing human judgment.",
  "AI output becomes structured data that can be saved, reviewed, measured, and reused.",
  "The workflow can be tested before adding database, authentication, or API complexity.",
];

export default function MethodsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Methods"
          title="The system matters more than the prompt."
          description="This lab builds AI-assisted workflows in small, testable steps: structured records, manual AI outputs, human review, saved state, and honest limitations."
        />

        <section className="mt-10 rounded-2xl border border-cyan-500/20 bg-slate-900/70 p-6">
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
            Current build method
          </span>
          <p className="mt-5 max-w-3xl text-sm leading-6 text-slate-300">
            The method is now proven in two live demos: Lead Follow-up Assistant
            applies it to customer inquiries, while Recruitment Workflow
            Assistant applies it to candidate screening. Both use manual AI
            mode, save structured results locally, and keep a human review step
            before action.
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
              Shared workflow pattern
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {sharedPattern.map((step) => (
                <span
                  key={step}
                  className="rounded-full border border-slate-700 px-3 py-1 text-xs font-medium text-slate-300"
                >
                  {step}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
            <h2 className="text-xl font-semibold text-white">Why it matters</h2>
            <ul className="mt-4 space-y-3">
              {whyItMatters.map((point) => (
                <li key={point} className="text-sm leading-6 text-slate-400">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-8 grid gap-5">
          {methods.map((method, index) => (
            <article
              key={method.title}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Method {index + 1}
              </p>
              <h2 className="mt-3 text-xl font-semibold text-white">
                {method.title}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                {method.description}
              </p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
