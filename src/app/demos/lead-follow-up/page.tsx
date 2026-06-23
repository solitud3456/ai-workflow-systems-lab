import PageHeader from "@/components/PageHeader";

const workflowSteps = [
  "Customer inquiry received",
  "Lead record created",
  "Need and urgency summarized",
  "Reply draft prepared",
  "Human reviews before sending",
  "Follow-up action saved",
];

export default function LeadFollowUpPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <PageHeader
          eyebrow="Demo 01"
          title="Lead Follow-up Assistant"
          description="A workflow demo for turning messy customer inquiries into structured lead records, reply drafts, follow-up actions, and human-reviewed next steps."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-semibold text-white">
              Business problem
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              Small teams often lose potential customers because inquiries are
              scattered across inboxes, replies are inconsistent, and follow-up
              actions are forgotten.
            </p>

            <p className="mt-4 leading-7 text-slate-300">
              This demo shows how an AI-assisted workflow can structure the
              lead, draft a response, and keep a human in control before any
              message is sent.
            </p>
          </section>

          <section className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6">
            <h2 className="text-2xl font-semibold text-cyan-200">
              Current build status
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              This page is the starting shell. Next, we will add the lead intake
              form, lead list, status pipeline, and manual AI mode.
            </p>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-2xl font-semibold text-white">
            Target workflow
          </h2>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div
                key={step}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <p className="text-sm font-semibold text-cyan-300">
                  Step {index + 1}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}