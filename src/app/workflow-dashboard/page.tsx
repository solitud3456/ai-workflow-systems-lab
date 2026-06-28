"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

const workflows = [
  {
    key: "lead",
    name: "Lead Follow-up Assistant",
    description:
      "Turns messy customer inquiries into structured lead records, manual AI analysis, human-reviewed next steps, and reusable reply drafts.",
    demoHref: "/demos/lead-follow-up",
    apiEndpoint: "/api/lead-records",
    humanReview:
      "Human review happens before using the suggested follow-up reply.",
  },
  {
    key: "recruitment",
    name: "Recruitment Workflow Assistant",
    description:
      "Organizes candidate notes into screening summaries, interview questions, and recruiter next steps without treating AI as the hiring decision.",
    demoHref: "/demos/recruitment-assistant",
    apiEndpoint: "/api/recruitment-records",
    humanReview:
      "Human review happens before using screening notes or interview questions.",
  },
  {
    key: "document",
    name: "Document Intake Assistant",
    description:
      "Turns pasted document text into summaries, key points, missing information, action items, and review-ready next steps.",
    demoHref: "/demos/document-intake",
    apiEndpoint: "/api/document-records",
    humanReview:
      "Human review happens before acting on extracted document details.",
  },
] as const;

type WorkflowKey = (typeof workflows)[number]["key"];

type DemoRecord = {
  analysis_approved?: boolean;
  created_at?: string | null;
  updated_at?: string | null;
};

type WorkflowMetric = {
  status: "loading" | "ready" | "error";
  recordCount: number;
  approvedCount: number;
  latestUpdatedAt: string | null;
  error: string | null;
};

type MetricsByWorkflow = Record<WorkflowKey, WorkflowMetric>;

const loadingMetric: WorkflowMetric = {
  status: "loading",
  recordCount: 0,
  approvedCount: 0,
  latestUpdatedAt: null,
  error: null,
};

function buildInitialMetrics(): MetricsByWorkflow {
  return {
    lead: loadingMetric,
    recruitment: loadingMetric,
    document: loadingMetric,
  };
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isObjectRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return "Metrics are unavailable right now.";
}

function getApiError(body: unknown, fallback: string) {
  if (isObjectRecord(body) && typeof body.error === "string") {
    return body.error;
  }

  return fallback;
}

function getRecordDate(record: DemoRecord) {
  return record.updated_at || record.created_at || null;
}

function getLatestUpdatedAt(records: DemoRecord[]) {
  let latestTime = 0;
  let latestValue: string | null = null;

  records.forEach((record) => {
    const value = getRecordDate(record);

    if (!value) {
      return;
    }

    const time = new Date(value).getTime();

    if (!Number.isNaN(time) && time > latestTime) {
      latestTime = time;
      latestValue = value;
    }
  });

  return latestValue;
}

function formatDate(value: string | null) {
  if (!value) {
    return "No synced records yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function formatSummaryDate(value: string | null) {
  if (!value) {
    return "No synced records yet";
  }

  return formatDate(value);
}

function getLatestMetricDate(metrics: WorkflowMetric[]) {
  let latestTime = 0;
  let latestValue: string | null = null;

  metrics.forEach((metric) => {
    if (!metric.latestUpdatedAt) {
      return;
    }

    const time = new Date(metric.latestUpdatedAt).getTime();

    if (!Number.isNaN(time) && time > latestTime) {
      latestTime = time;
      latestValue = metric.latestUpdatedAt;
    }
  });

  return latestValue;
}

async function fetchWorkflowMetric(
  endpoint: string,
): Promise<Omit<WorkflowMetric, "status" | "error">> {
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

  const records = body.records.filter(isObjectRecord) as DemoRecord[];

  return {
    recordCount: records.length,
    approvedCount: records.filter(
      (record) => record.analysis_approved === true,
    ).length,
    latestUpdatedAt: getLatestUpdatedAt(records),
  };
}

function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

export default function WorkflowDashboardPage() {
  const [metrics, setMetrics] =
    useState<MetricsByWorkflow>(buildInitialMetrics);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const workflowMetrics = workflows.map((workflow) => metrics[workflow.key]);
  const isLoadingMetrics = workflowMetrics.some(
    (metric) => metric.status === "loading",
  );
  const failedMetricCount = workflowMetrics.filter(
    (metric) => metric.status === "error",
  ).length;
  const totalSavedRecords = workflowMetrics.reduce(
    (total, metric) => total + metric.recordCount,
    0,
  );
  const totalApprovedAnalyses = workflowMetrics.reduce(
    (total, metric) => total + metric.approvedCount,
    0,
  );
  const latestUpdatedAt = getLatestMetricDate(workflowMetrics);
  const summaryValues = [
    {
      label: "Total saved records",
      value: isLoadingMetrics ? "Loading" : totalSavedRecords,
    },
    {
      label: "Lead records",
      value: isLoadingMetrics ? "Loading" : metrics.lead.recordCount,
    },
    {
      label: "Recruitment records",
      value: isLoadingMetrics ? "Loading" : metrics.recruitment.recordCount,
    },
    {
      label: "Document records",
      value: isLoadingMetrics ? "Loading" : metrics.document.recordCount,
    },
    {
      label: "Approved analyses",
      value: isLoadingMetrics ? "Loading" : totalApprovedAnalyses,
    },
    {
      label: "Latest update",
      value: isLoadingMetrics ? "Loading" : formatSummaryDate(latestUpdatedAt),
    },
  ];

  const loadMetrics = useCallback(async () => {
    setMetrics(buildInitialMetrics());

    const results = await Promise.all(
      workflows.map(async (workflow) => {
        try {
          const metric = await fetchWorkflowMetric(workflow.apiEndpoint);

          return {
            key: workflow.key,
            metric: {
              ...metric,
              status: "ready" as const,
              error: null,
            },
          };
        } catch (error) {
          return {
            key: workflow.key,
            metric: {
              ...loadingMetric,
              status: "error" as const,
              error: getErrorMessage(error),
            },
          };
        }
      }),
    );

    const nextMetrics = buildInitialMetrics();

    results.forEach((result) => {
      nextMetrics[result.key] = result.metric;
    });

    setMetrics(nextMetrics);
    setLastLoadedAt(new Date().toLocaleString());
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMetrics();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadMetrics]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            eyebrow="Workflow dashboard"
            title="Three workflow systems in one view."
            description="A public portfolio dashboard for comparing the current manual-AI prototypes: lead follow-up, recruitment screening, and document intake. The demos still use localStorage as the main workspace, with optional Supabase sync for persistence experiments."
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:min-w-56">
            <button
              type="button"
              onClick={loadMetrics}
              className="w-full rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100"
            >
              Refresh metrics
            </button>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {lastLoadedAt
                ? `Last refreshed: ${lastLoadedAt}`
                : "Metrics load from optional Supabase sync APIs."}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
          <h2 className="text-base font-semibold text-white">
            Honest prototype status
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            These are manual-AI workflow prototypes, not production SaaS. Each
            demo starts in the browser with localStorage, then can optionally
            save records to Supabase through the existing API routes.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Workflow database summary
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Public metrics from optional Supabase sync records. The demos
                still use localStorage as the main workspace.
              </p>
            </div>

            {failedMetricCount > 0 ? (
              <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {failedMetricCount} metric source
                {failedMetricCount === 1 ? "" : "s"} unavailable
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaryValues.map((item) => (
              <SummaryBox
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </section>

        <div className="mt-8 grid gap-6">
          {workflows.map((workflow) => {
            const metric = metrics[workflow.key];

            return (
              <article
                key={workflow.key}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold tracking-tight text-white">
                        {workflow.name}
                      </h2>
                      <span
                        className={
                          metric.status === "ready"
                            ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
                            : metric.status === "error"
                              ? "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300"
                              : "rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-300"
                        }
                      >
                        {metric.status === "ready"
                          ? "Supabase metrics loaded"
                          : metric.status === "error"
                            ? "Metrics fallback"
                            : "Loading metrics"}
                      </span>
                    </div>

                    <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">
                      {workflow.description}
                    </p>

                    <dl className="mt-5 grid gap-4 text-sm md:grid-cols-3">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Storage model
                        </dt>
                        <dd className="mt-1 leading-6 text-slate-300">
                          localStorage workspace + optional Supabase sync
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Human review
                        </dt>
                        <dd className="mt-1 leading-6 text-slate-300">
                          {workflow.humanReview}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          Database sync
                        </dt>
                        <dd className="mt-1 leading-6 text-slate-300">
                          Optional, through existing server API route
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <Link
                    href={workflow.demoHref}
                    className="w-fit shrink-0 rounded-full border border-cyan-400/60 px-5 py-3 text-center text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                  >
                    Open demo
                  </Link>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-3">
                  <MetricBox
                    label="Synced records"
                    value={
                      metric.status === "loading" ? "Loading" : metric.recordCount
                    }
                  />
                  <MetricBox
                    label="Approved analyses"
                    value={
                      metric.status === "loading"
                        ? "Loading"
                        : metric.approvedCount
                    }
                  />
                  <MetricBox
                    label="Latest update"
                    value={
                      metric.status === "loading"
                        ? "Loading"
                        : formatDate(metric.latestUpdatedAt)
                    }
                  />
                </div>

                {metric.status === "error" ? (
                  <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
                    Supabase metrics could not be loaded for this workflow:{" "}
                    {metric.error}
                  </p>
                ) : null}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
