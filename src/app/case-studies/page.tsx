import PageHeader from "@/components/PageHeader";

const caseStudies = [
  {
    title: "Lead Follow-up Assistant",
    status: "Next build",
    problem:
      "Small teams lose potential customers because inquiries are scattered, replies are inconsistent, and follow-ups are forgotten.",
    proof:
      "This case study will show the workflow before and after: inquiry intake, structured lead records, reply drafts, urgency scoring, and human review.",
  },
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

        <div className="mt-10 space-y-5">
          {caseStudies.map((study) => (
            <article
              key={study.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl font-semibold text-white">
                  {study.title}
                </h2>
                <span className="w-fit rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  {study.status}
                </span>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Problem
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {study.problem}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                    Portfolio proof
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {study.proof}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}