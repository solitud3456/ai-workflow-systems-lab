import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const cases = [
  {
    title: "Lead Follow-up Assistant",
    problem: "Customer inquiries arrive as messy free text from many channels.",
    proof:
      "The demo turns the inquiry into a tracked lead, saved analysis, reviewed next action, and copyable reply.",
    href: "/demos/lead-follow-up",
  },
  {
    title: "Recruitment Workflow Assistant",
    problem: "Candidate notes, application text, and recruiter comments need a consistent screening flow.",
    proof:
      "The demo saves candidate analysis, interview questions, and reviewed recruiter next steps.",
    href: "/demos/recruitment-assistant",
  },
  {
    title: "Document Intake Assistant",
    problem: "Pasted document text often hides missing details and action items.",
    proof:
      "The demo extracts summary fields, missing information, action items, and review status.",
    href: "/demos/document-intake",
  },
];

export default function CaseStudiesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Case Studies"
          title="Short notes on what each demo proves"
          description="This page is a compact archive. The workflow dashboard is the main overview."
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/workflow-dashboard"
            className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
          >
            View dashboard
          </Link>
          <Link
            href="/demos"
            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
          >
            View demos
          </Link>
        </div>

        <div className="mt-10 grid gap-5">
          {cases.map((item) => (
            <article
              key={item.href}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    <span className="font-semibold text-slate-200">
                      Problem:
                    </span>{" "}
                    {item.problem}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    <span className="font-semibold text-slate-200">
                      Proof:
                    </span>{" "}
                    {item.proof}
                  </p>
                </div>

                <Link
                  href={item.href}
                  className="w-fit shrink-0 rounded-full border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                >
                  Open demo
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
