import Link from "next/link";
import PageHeader from "@/components/PageHeader";

const methodSteps = [
  "Start with messy intake.",
  "Track status and notes.",
  "Use structured manual AI output.",
  "Require human review.",
  "Turn reviewed output into tasks or next steps.",
];

export default function MethodsPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-5xl">
        <PageHeader
          eyebrow="Methods"
          title="A compact workflow method"
          description="The demos use one simple pattern: intake, structure, review, and action."
        />

        <ol className="mt-10 grid gap-4 md:grid-cols-5">
          {methodSteps.map((step, index) => (
            <li
              key={step}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"
            >
              <p className="text-xs font-semibold text-cyan-300">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{step}</p>
            </li>
          ))}
        </ol>

        <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6">
          <h2 className="text-xl font-semibold text-white">Current stance</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The project keeps AI assistance visible and reviewable. API-driven
            automation can come later; the current value is proving the
            workflow first.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/workflow-dashboard"
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              View dashboard
            </Link>
            <Link
              href="/demos"
              className="rounded-full border border-cyan-400/50 px-5 py-3 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
            >
              View demos
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
