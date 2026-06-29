import { connection } from "next/server";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import {
  isSupabaseConfigured,
  supabaseClient,
} from "@/lib/supabaseClient";

type ConnectionCheck = {
  ok: boolean;
  message: string;
};

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

async function checkSupabaseConnection(): Promise<ConnectionCheck> {
  if (!supabaseClient || !isSupabaseConfigured) {
    return {
      ok: false,
      message:
        "Supabase client is not configured. Add the public URL and publishable key to the environment.",
    };
  }

  const { error } = await supabaseClient
    .from("demo_records")
    .select("id")
    .limit(1);

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: "Connection check passed",
  };
}

export default async function SupabaseStatusPage() {
  if (process.env.INTERNAL_TOOLS_ENABLED !== "true") {
    return <InternalToolsDisabled />;
  }

  await connection();

  const envChecks = [
    {
      label: "NEXT_PUBLIC_SUPABASE_URL",
      present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    {
      label: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
    },
  ];
  const connectionCheck = await checkSupabaseConnection();

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-4xl">
        <PageHeader
          eyebrow="Internal"
          title="Supabase Status"
          description="A small development verification page for checking whether the optional Supabase foundation is configured. It does not change demo data or write to the database."
        />

        <Link
          href="/internal"
          className="mt-8 inline-flex rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
        >
          Internal tools
        </Link>

        <section className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <h2 className="text-xl font-semibold text-white">
            Environment checks
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {envChecks.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-4"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  {item.label}
                </p>
                <p
                  className={
                    item.present
                      ? "mt-3 text-sm font-semibold text-emerald-300"
                      : "mt-3 text-sm font-semibold text-amber-300"
                  }
                >
                  {item.present ? "Present" : "Missing"}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Read-only connection check
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Runs a harmless select query against{" "}
                <code className="rounded bg-slate-950/70 px-1.5 py-0.5 text-cyan-200">
                  public.demo_records
                </code>
                .
              </p>
            </div>

            <span
              className={
                connectionCheck.ok
                  ? "w-fit rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                  : "w-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300"
              }
            >
              {connectionCheck.ok ? "Passed" : "Needs attention"}
            </span>
          </div>

          <p
            className={
              connectionCheck.ok
                ? "mt-5 rounded-xl border border-emerald-500/20 bg-slate-950/60 p-4 text-sm text-emerald-200"
                : "mt-5 rounded-xl border border-amber-500/20 bg-slate-950/60 p-4 text-sm text-amber-200"
            }
          >
            {connectionCheck.message}
          </p>
        </section>
      </section>
    </main>
  );
}
