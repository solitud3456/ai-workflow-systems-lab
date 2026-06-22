import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";

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

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {caseStudies.map((study) => (
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