import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const demos = [
  {
    name: "Lead Follow-up Assistant",
    description:
      "Capture customer inquiries, save AI analysis, review the result, and copy a suggested reply.",
    href: "/demos/lead-follow-up",
    label: "Open lead demo",
  },
  {
    name: "Recruitment Workflow Assistant",
    description:
      "Turn candidate notes into screening summaries, interview questions, and recruiter next steps.",
    href: "/demos/recruitment-assistant",
    label: "Open recruitment demo",
  },
  {
    name: "Document Intake Assistant",
    description:
      "Extract summaries, missing information, and action items from pasted document text.",
    href: "/demos/document-intake",
    label: "Open document demo",
  },
  {
    name: "Support Ticket Assistant",
    description:
      "Triage customer support messages into summaries, next actions, escalation signals, and reply drafts.",
    href: "/demos/support-ticket",
    label: "Open support demo",
  },
  {
    name: "Invoice Follow-up Assistant",
    description:
      "Review invoice context, payment risk, missing details, and reminder drafts.",
    href: "/demos/invoice-follow-up",
    label: "Open invoice demo",
  },
  {
    name: "Meeting Action Assistant",
    description:
      "Turn meeting notes into decisions, action items, owners, and follow-up tasks.",
    href: "/demos/meeting-actions",
    label: "Open meeting demo",
  },
  {
    name: "IT Request Assistant",
    description:
      "Triage internal IT requests into approvals, risk checks, and task checklists.",
    href: "/demos/it-request",
    label: "Open IT demo",
  },
  {
    name: "Vendor Request Assistant",
    description:
      "Review vendor messages for missing information, risk, decisions, and replies.",
    href: "/demos/vendor-request",
    label: "Open vendor demo",
  },
];

export default function DemosPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            eyebrow="Demos"
            title="Live workflow demos"
            description="Eight working prototypes for testing manual-AI workflow patterns."
          />

          <Link
            href="/workflow-dashboard"
            className="w-fit rounded-full border border-cyan-400/50 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
          >
            View dashboard
          </Link>
        </div>

        <p className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-sm leading-6 text-slate-400">
          Each demo runs in the browser and includes a sample JSON helper for
          quick testing. Optional Supabase sync is available inside the demos
          where implemented.
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {demos.map((demo) => (
            <article
              key={demo.href}
              className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <h2 className="text-xl font-semibold text-white">{demo.name}</h2>
              <p className="mt-3 flex-1 text-sm leading-6 text-slate-400">
                {demo.description}
              </p>
              <Link
                href={demo.href}
                className="mt-6 w-fit rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {demo.label}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
