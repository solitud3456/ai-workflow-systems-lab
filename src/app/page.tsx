import Link from "next/link";

const primaryLinks = [
  {
    title: "Workflow dashboard",
    description: "See the workflow systems and synced-record metrics.",
    href: "/workflow-dashboard",
    label: "Open dashboard",
    primary: true,
  },
  {
    title: "Live demos",
    description:
      "Try the company workflow demo modules.",
    href: "/demos",
    label: "View demos",
    primary: false,
  },
  {
    title: "Internal tools",
    description: "Development utilities for tasks, records, review, and logs.",
    href: "/internal",
    label: "Open internal",
    primary: false,
  },
];

const demos = [
  {
    name: "Lead Follow-up Assistant",
    href: "/demos/lead-follow-up",
  },
  {
    name: "Recruitment Workflow Assistant",
    href: "/demos/recruitment-assistant",
  },
  {
    name: "Document Intake Assistant",
    href: "/demos/document-intake",
  },
  {
    name: "Support Ticket Assistant",
    href: "/demos/support-ticket",
  },
  {
    name: "Invoice Follow-up Assistant",
    href: "/demos/invoice-follow-up",
  },
  {
    name: "Meeting Action Assistant",
    href: "/demos/meeting-actions",
  },
  {
    name: "IT Request Assistant",
    href: "/demos/it-request",
  },
  {
    name: "Vendor Request Assistant",
    href: "/demos/vendor-request",
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
          Practical workflow prototypes with AI-assisted review.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Eight working demos show the same manual-AI pattern across sales,
          hiring, documents, support, finance, meetings, IT, and vendor work.
          The clearest overview is the workflow dashboard.
        </p>

        <p className="mt-4 text-sm font-medium text-slate-400">
          Live site:{" "}
          <a
            href="https://ai-workflow-systems-lab.vercel.app"
            className="text-cyan-300 transition hover:text-cyan-200"
          >
            ai-workflow-systems-lab.vercel.app
          </a>
        </p>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {primaryLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.primary
                  ? "rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5 transition hover:border-cyan-300"
                  : "rounded-2xl border border-slate-800 bg-slate-900/70 p-5 transition hover:border-cyan-500/50"
              }
            >
              <h2 className="text-lg font-semibold text-white">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                {item.description}
              </p>
              <span className="mt-5 inline-flex rounded-full border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200">
                {item.label}
              </span>
            </Link>
          ))}
        </div>

        <section className="mt-12 border-t border-slate-800 pt-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">
                Current demos
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Manual-AI workflow prototypes with optional Supabase sync.
              </p>
            </div>

            <a
              href="https://github.com/solitud3456/ai-workflow-systems-lab"
              target="_blank"
              rel="noreferrer"
              className="w-fit rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              View GitHub repo
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {demos.map((demo) => (
              <Link
                key={demo.href}
                href={demo.href}
                className="rounded-full border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
              >
                {demo.name}
              </Link>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
