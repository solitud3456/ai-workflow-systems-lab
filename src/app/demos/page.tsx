import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
const demos = [
  {
  title: "Lead Follow-up Assistant",
  status: "Builds first",
  href: "/demos/lead-follow-up",
  description:
    "A workflow demo for turning customer inquiries into structured lead records, reply drafts, urgency scores, and follow-up actions.",
},
  {
    title: "HR Workflow Assistant",
    status: "Planned",
    description:
      "A workflow demo for organizing candidate records, CV summaries, interview preparation, and onboarding checklists.",
  },
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

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {demos.map((demo) => (
            <InfoCard
  key={demo.title}
  title={demo.title}
  description={demo.description}
  tag={demo.status}
  href={demo.href}
/>
          ))}
        </div>
      </section>
    </main>
  );
}