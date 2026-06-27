"use client";

import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

const recordSections = [
  {
    key: "lead",
    title: "Lead Follow-up records",
    endpoint: "/api/lead-records",
  },
  {
    key: "recruitment",
    title: "Recruitment records",
    endpoint: "/api/recruitment-records",
  },
  {
    key: "document",
    title: "Document Intake records",
    endpoint: "/api/document-records",
  },
] as const;

type SectionKey = (typeof recordSections)[number]["key"];

type DemoRecord = {
  id: string;
  title: string;
  status: string;
  source: string | null;
  raw_input: unknown;
  analysis: unknown;
  analysis_approved: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type RecordsBySection = Record<SectionKey, DemoRecord[]>;
type ErrorsBySection = Partial<Record<SectionKey, string>>;

function buildEmptyRecords(): RecordsBySection {
  return {
    lead: [],
    recruitment: [],
    document: [],
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeDemoRecord(value: unknown, index: number): DemoRecord {
  const record = isObjectRecord(value) ? value : {};

  return {
    id: getString(record.id, `record-${index}`),
    title: getString(record.title, "Untitled record"),
    status: getString(record.status, "Unknown"),
    source: getNullableString(record.source),
    raw_input: record.raw_input ?? null,
    analysis: record.analysis ?? null,
    analysis_approved:
      typeof record.analysis_approved === "boolean"
        ? record.analysis_approved
        : false,
    created_at: getNullableString(record.created_at),
    updated_at: getNullableString(record.updated_at),
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isObjectRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown error while loading demo records.";
}

function getApiError(body: unknown, fallback: string) {
  if (isObjectRecord(body) && typeof body.error === "string") {
    return body.error;
  }

  return fallback;
}

async function fetchDemoRecords(endpoint: string): Promise<DemoRecord[]> {
  const response = await fetch(endpoint, {
    cache: "no-store",
  });

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The API response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error(getApiError(body, "The API request failed."));
  }

  if (!isObjectRecord(body) || body.ok !== true || !Array.isArray(body.records)) {
    throw new Error("The API response did not include a records array.");
  }

  return body.records.map(normalizeDemoRecord);
}

function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatJsonDetails(record: DemoRecord) {
  return JSON.stringify(
    {
      raw_input: parseMaybeJson(record.raw_input),
      analysis: record.analysis ?? null,
    },
    null,
    2,
  );
}

function RecordCard({ record }: { record: DemoRecord }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-white">
            {record.title}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Source: {record.source || "Not set"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
            {record.status}
          </span>
          <span
            className={
              record.analysis_approved
                ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                : "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300"
            }
          >
            analysis_approved: {record.analysis_approved ? "true" : "false"}
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            created_at
          </dt>
          <dd className="mt-1 text-slate-300">{formatDate(record.created_at)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            updated_at
          </dt>
          <dd className="mt-1 text-slate-300">{formatDate(record.updated_at)}</dd>
        </div>
      </dl>

      <details className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-cyan-200">
          JSON details
        </summary>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">
          {formatJsonDetails(record)}
        </pre>
      </details>
    </article>
  );
}

export default function DemoRecordsPage() {
  const [recordsBySection, setRecordsBySection] =
    useState<RecordsBySection>(buildEmptyRecords);
  const [errorsBySection, setErrorsBySection] = useState<ErrorsBySection>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setErrorsBySection({});

    const results = await Promise.all(
      recordSections.map(async (section) => {
        try {
          const records = await fetchDemoRecords(section.endpoint);

          return {
            key: section.key,
            records,
            error: null,
          };
        } catch (error) {
          return {
            key: section.key,
            records: [],
            error: getErrorMessage(error),
          };
        }
      }),
    );

    const nextRecords = buildEmptyRecords();
    const nextErrors: ErrorsBySection = {};

    results.forEach((result) => {
      nextRecords[result.key] = result.records;

      if (result.error) {
        nextErrors[result.key] = result.error;
      }
    });

    setRecordsBySection(nextRecords);
    setErrorsBySection(nextErrors);
    setLastLoadedAt(new Date().toLocaleString());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRecords();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRecords]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            eyebrow="Internal"
            title="Demo Records"
            description="A small development viewer for checking optional Supabase persistence through the existing internal API routes. This page is read-only and does not expose Supabase keys."
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:min-w-56">
            <button
              type="button"
              onClick={loadRecords}
              disabled={isLoading}
              className="w-full rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "Refresh records"}
            </button>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {lastLoadedAt
                ? `Last refreshed: ${lastLoadedAt}`
                : "Records load automatically on page open."}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
          <h2 className="text-base font-semibold text-white">
            Internal/dev utility
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This viewer reads from the same API routes used by optional demo
            sync. It does not edit records, delete records, add auth, change
            RLS, or connect directly to Supabase from the browser.
          </p>
        </section>

        <div className="mt-8 grid gap-6">
          {recordSections.map((section) => {
            const records = recordsBySection[section.key];
            const error = errorsBySection[section.key];

            return (
              <section
                key={section.key}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {section.title}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Loaded through{" "}
                      <code className="rounded bg-slate-950/70 px-1.5 py-0.5 text-cyan-200">
                        {section.endpoint}
                      </code>
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-cyan-200">
                    {records.length} {records.length === 1 ? "record" : "records"}
                  </span>
                </div>

                {isLoading ? (
                  <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
                    Loading records...
                  </p>
                ) : error ? (
                  <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                    {error}
                  </p>
                ) : records.length === 0 ? (
                  <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
                    No records found for this demo type.
                  </p>
                ) : (
                  <div className="mt-5 grid gap-4">
                    {records.map((record) => (
                      <RecordCard key={record.id} record={record} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>
    </main>
  );
}
