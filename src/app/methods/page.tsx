import PageHeader from "@/components/PageHeader";
import InfoCard from "@/components/InfoCard";
const methods = [
  "Workflow mapping",
  "Structured AI outputs",
  "Manual AI mode",
  "Human-in-the-loop review",
  "Dashboard-based operations",
  "Prompt and JSON schema design",
  "Source-grounded document analysis",
  "Audit logs and status tracking",
  "Limitations and safety notes",
];

export default function MethodsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <PageHeader
  eyebrow="Methods"
  title="The system matters more than the prompt."
  description="This lab focuses on applying AI inside controlled workflows, where outputs are structured, reviewed, saved, and connected to business actions."
/>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
  {methods.map((method) => (
    <InfoCard
      key={method}
      title={method}
      description="A practical method used to keep AI outputs structured, reviewable, and connected to real workflow actions."
    />
  ))}
</div>
      </section>
    </main>
  );
}