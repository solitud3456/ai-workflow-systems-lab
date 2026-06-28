import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import ReviewQueueClient from "./ReviewQueueClient";

function InternalToolsDisabled() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Internal"
          title="Internal tools are disabled."
          description="This development utility is only available when INTERNAL_TOOLS_ENABLED is set to true."
        />

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/"
            className="rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
          >
            Back home
          </Link>
          <Link
            href="/demos"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-500 hover:text-white"
          >
            View demos
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function ReviewQueuePage() {
  if (process.env.INTERNAL_TOOLS_ENABLED !== "true") {
    return <InternalToolsDisabled />;
  }

  return <ReviewQueueClient />;
}
