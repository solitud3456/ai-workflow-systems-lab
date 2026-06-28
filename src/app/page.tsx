import Link from "next/link";

const leadFollowUpFeatures = [
  "Lead intake",
  "Local browser persistence",
  "Manual AI prompt generation",
  "Pasted JSON analysis",
  "Human review",
  "Suggested reply copy",
  "Dashboard metrics",
];

const recruitmentFeatures = [
  "Candidate intake",
  "Candidate status tracking",
  "Manual AI screening prompt",
  "Pasted JSON candidate analysis",
  "Human review",
  "Interview question suggestions",
  "Dashboard metrics",
];

const documentIntakeFeatures = [
  "Document intake",
  "Document status tracking",
  "Manual AI extraction prompt",
  "Pasted JSON document analysis",
  "Human review",
  "Key points",
  "Missing information",
  "Action items",
  "Dashboard metrics",
];

const sharedWorkflowPattern = [
  "Intake",
  "Status tracking",
  "Manual AI prompt",
  "Strict JSON analysis",
  "Human review",
  "Copyable output",
  "Dashboard metrics",
];

const workingNow = [
  "Three live demos",
  "localStorage persistence",
  "Manual AI prompt generation",
  "Pasted JSON analysis",
  "Human review",
  "Dashboard metrics",
  "Copyable next-step outputs",
];

const notBuiltYet = [
  "Real database",
  "Authentication",
  "Live AI API integration",
  "CRM, ATS, or email integrations",
  "File upload or OCR",
  "Multi-user accounts",
];

const nextUpgrades = [
  "Supabase or database storage",
  "Authentication",
  "Automated AI API mode with review controls",
  "Export and reporting",
  "Stronger reusable components",
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
          human review, and dashboard-based process improvement. Three live
          working demos are now available: Lead Follow-up Assistant,
          Recruitment Workflow Assistant, and Document Intake Assistant.
        </p>
        <p className="mt-4 text-sm font-medium text-slate-400">
          Live site deployed at{" "}
          <a
            href="https://ai-workflow-systems-lab.vercel.app"
            className="text-cyan-300 transition hover:text-cyan-200"
          >
            ai-workflow-systems-lab.vercel.app
          </a>
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

        <section className="mt-14 border-y border-slate-800 py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
                Shared method
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                One repeatable workflow pattern
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              The same structure supports customer inquiries, candidate
              screening, and document intake. These remain manual-AI,
              localStorage prototypes built as portfolio proof, not agency
              claims or production automation.
            </p>
          </div>

          <ol className="mt-8 grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            {sharedWorkflowPattern.map((step, index) => (
              <li
                key={step}
                className="border-l border-slate-700 pl-4"
              >
                <p className="text-xs font-semibold text-cyan-300">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <p className="mt-2 text-sm font-medium text-slate-200">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </section>

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

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            Second live working demo
          </span>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Recruitment Workflow Assistant
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                An applied workflow demo for turning candidate notes into
                structured screening summaries, suggested interview questions,
                and human-reviewed recruiter next steps using manual AI mode.
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
              className="w-fit shrink-0 rounded-full border border-cyan-400/60 px-5 py-3 text-center text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
            >
              Open recruitment demo
            </Link>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
            Third live working demo
          </span>
          <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Document Intake Assistant
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
                A manual-AI workflow demo for turning pasted document text into
                structured summaries, key points, missing information, action
                items, and human-reviewed next steps.
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
              className="w-fit shrink-0 rounded-full border border-cyan-400/60 px-5 py-3 text-center text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
            >
              Open document demo
            </Link>
          </div>
        </section>

        <section className="mt-14 border-t border-slate-800 pt-10">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
            Project status
          </p>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <h2 className="text-3xl font-semibold tracking-tight text-white">
              What works, what does not, and what comes next
            </h2>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              A transparent snapshot of this portfolio lab. The current build
              proves the manual workflow before adding production database,
              account, and integration complexity.
            </p>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-3">
            <div className="border-l border-cyan-500/50 pl-5">
              <h3 className="text-lg font-semibold text-cyan-200">
                Working now
              </h3>
              <ul className="mt-4 space-y-3">
                {workingNow.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-300">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-l border-amber-500/40 pl-5">
              <h3 className="text-lg font-semibold text-amber-200">
                Not built yet
              </h3>
              <ul className="mt-4 space-y-3">
                {notBuiltYet.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-400">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-l border-slate-600 pl-5">
              <h3 className="text-lg font-semibold text-white">
                Next upgrades
              </h3>
              <ul className="mt-4 space-y-3">
                {nextUpgrades.map((item) => (
                  <li key={item} className="text-sm leading-6 text-slate-300">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-14 border-y border-cyan-500/20 py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-400">
                Explore the lab
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Explore the live workflow demos
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
                The best way to understand the project is to open the demos and
                test the manual prompt, pasted JSON, human review, and saved
                workflow for yourself.
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/demos"
                className="rounded-full bg-cyan-400 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                View all demos
              </Link>
              <Link
                href="/workflow-dashboard"
                className="rounded-full border border-cyan-400/60 px-5 py-3 text-center text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
              >
                View workflow dashboard
              </Link>
              <Link
                href="/case-studies"
                className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Read case studies
              </Link>
              <Link
                href="/methods"
                className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                Read the method
              </Link>
              <a
                href="https://github.com/solitud3456/ai-workflow-systems-lab"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                View GitHub repo
              </a>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}
