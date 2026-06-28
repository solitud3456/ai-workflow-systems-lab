"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";

const workflows = [
  {
    key: "lead",
    label: "Lead Follow-up",
    apiEndpoint: "/api/lead-records",
  },
  {
    key: "recruitment",
    label: "Recruitment Workflow",
    apiEndpoint: "/api/recruitment-records",
  },
  {
    key: "document",
    label: "Document Intake",
    apiEndpoint: "/api/document-records",
  },
] as const;

const UNSPECIFIED_STATUS = "Unspecified";

type Workflow = (typeof workflows)[number];
type WorkflowKey = Workflow["key"];
type WorkflowFilter = "all" | WorkflowKey;
type ApprovalFilter = "all" | "approved" | "not-approved";

type DemoRecord = {
  boardKey: string;
  id: string;
  workflowKey: WorkflowKey;
  workflowLabel: string;
  apiEndpoint: string;
  demo_type: string;
  title: string;
  status: string;
  source: string | null;
  analysis: unknown;
  analysis_approved: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type ErrorsByWorkflow = Partial<Record<WorkflowKey, string>>;
type ActionMessage = {
  kind: "success" | "error";
  text: string;
} | null;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function getNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isObjectRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown error while loading workflow board records.";
}

function getApiError(body: unknown, fallback: string) {
  if (isObjectRecord(body) && typeof body.error === "string") {
    return body.error;
  }

  return fallback;
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

function truncateText(value: string, maxLength = 190) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function getObjectText(value: Record<string, unknown>, key: string) {
  return typeof value[key] === "string" ? value[key] : null;
}

function getArrayText(value: Record<string, unknown>, key: string) {
  const field = value[key];

  if (!Array.isArray(field)) {
    return null;
  }

  const text = field
    .filter((item): item is string => typeof item === "string")
    .join(" ");

  return text || null;
}

function getAnalysisSummary(analysis: unknown) {
  const parsedAnalysis = parseMaybeJson(analysis);

  if (!parsedAnalysis) {
    return "No saved analysis yet.";
  }

  if (isObjectRecord(parsedAnalysis)) {
    const parts = [
      getObjectText(parsedAnalysis, "summary"),
      getObjectText(parsedAnalysis, "customerIntent"),
      getObjectText(parsedAnalysis, "strengths"),
      getObjectText(parsedAnalysis, "concerns"),
      getObjectText(parsedAnalysis, "documentType"),
      getArrayText(parsedAnalysis, "keyPoints"),
      getArrayText(parsedAnalysis, "missingInformation"),
      getArrayText(parsedAnalysis, "actionItems"),
      getArrayText(parsedAnalysis, "suggestedInterviewQuestions"),
      getObjectText(parsedAnalysis, "nextAction"),
      getObjectText(parsedAnalysis, "riskNote"),
    ].filter((part): part is string => Boolean(part));

    if (parts.length > 0) {
      return truncateText(parts.join(" "));
    }

    return truncateText(JSON.stringify(parsedAnalysis));
  }

  if (Array.isArray(parsedAnalysis)) {
    return truncateText(parsedAnalysis.join(" "));
  }

  return truncateText(String(parsedAnalysis));
}

function getAnalysisSearchText(analysis: unknown) {
  const parsedAnalysis = parseMaybeJson(analysis);

  if (!parsedAnalysis) {
    return "";
  }

  if (typeof parsedAnalysis === "string") {
    return parsedAnalysis;
  }

  return JSON.stringify(parsedAnalysis);
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

function getLatestDate(record: DemoRecord) {
  return record.updated_at || record.created_at;
}

function getStatusColumn(record: DemoRecord) {
  return record.status.trim() || UNSPECIFIED_STATUS;
}

function normalizeDemoRecord(
  value: unknown,
  index: number,
  workflow: Workflow,
): DemoRecord {
  const record = isObjectRecord(value) ? value : {};
  const id = getString(record.id, `${workflow.key}-record-${index}`);

  return {
    boardKey: `${workflow.key}:${id}`,
    id,
    workflowKey: workflow.key,
    workflowLabel: workflow.label,
    apiEndpoint: workflow.apiEndpoint,
    demo_type: getString(record.demo_type, "unknown"),
    title: getString(record.title, "Untitled record"),
    status: getString(record.status),
    source: getNullableString(record.source),
    analysis: record.analysis ?? null,
    analysis_approved:
      typeof record.analysis_approved === "boolean"
        ? record.analysis_approved
        : false,
    created_at: getNullableString(record.created_at),
    updated_at: getNullableString(record.updated_at),
  };
}

function getApiEndpointForDemoType(record: DemoRecord) {
  if (record.demo_type === "lead_follow_up") {
    return "/api/lead-records";
  }

  if (record.demo_type === "recruitment_assistant") {
    return "/api/recruitment-records";
  }

  if (record.demo_type === "document_intake") {
    return "/api/document-records";
  }

  return record.apiEndpoint;
}

async function fetchWorkflowRecords(workflow: Workflow): Promise<DemoRecord[]> {
  const response = await fetch(workflow.apiEndpoint, {
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

  return body.records.map((record, index) =>
    normalizeDemoRecord(record, index, workflow),
  );
}

async function updateRecordStatus(record: DemoRecord, status: string) {
  const response = await fetch(
    `${getApiEndpointForDemoType(record)}?id=${encodeURIComponent(record.id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: status.trim(),
      }),
    },
  );

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The API response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error(getApiError(body, "The update request failed."));
  }

  if (!isObjectRecord(body) || body.ok !== true) {
    throw new Error("The API response did not confirm the update action.");
  }
}

function matchesSearch(record: DemoRecord, query: string) {
  if (!query) {
    return true;
  }

  const searchableText = [
    record.workflowLabel,
    record.title,
    record.status,
    record.source,
    getAnalysisSummary(record.analysis),
    getAnalysisSearchText(record.analysis),
  ]
    .filter((item): item is string => Boolean(item))
    .join(" ")
    .toLowerCase();

  return searchableText.includes(query);
}

function buildStatusColumns(records: DemoRecord[]) {
  const statusSet = new Set(records.map(getStatusColumn));
  const statuses = Array.from(statusSet);

  return statuses.sort((first, second) => {
    if (first === UNSPECIFIED_STATUS) {
      return 1;
    }

    if (second === UNSPECIFIED_STATUS) {
      return -1;
    }

    return first.localeCompare(second);
  });
}

function groupRecordsByStatus(records: DemoRecord[], statuses: string[]) {
  return statuses.map((status) => ({
    status,
    records: records.filter((record) => getStatusColumn(record) === status),
  }));
}

function BoardMetric({
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

function WorkflowBoardCard({
  record,
  statusOptions,
  isSaving,
  onStatusChange,
}: {
  record: DemoRecord;
  statusOptions: string[];
  isSaving: boolean;
  onStatusChange: (status: string) => void;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
          {record.workflowLabel}
        </span>
        <span
          className={
            record.analysis_approved
              ? "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300"
              : "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300"
          }
        >
          {record.analysis_approved ? "Approved" : "Needs review"}
        </span>
      </div>

      <h3 className="mt-3 text-base font-semibold leading-6 text-white">
        {record.title}
      </h3>
      <p className="mt-1 text-sm text-slate-400">
        Source: {record.source || "Not set"}
      </p>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/80 p-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Analysis
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {getAnalysisSummary(record.analysis)}
        </p>
      </div>

      <dl className="mt-4 grid gap-3 text-sm">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Updated
          </dt>
          <dd className="mt-1 text-slate-300">
            {formatDate(getLatestDate(record))}
          </dd>
        </div>
      </dl>

      <label className="mt-4 block text-sm font-semibold text-slate-200">
        Move to status
        <select
          value={record.status.trim()}
          onChange={(event) => onStatusChange(event.target.value)}
          disabled={isSaving || statusOptions.length === 0}
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="">Choose status</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}

export default function WorkflowBoardClient() {
  const [records, setRecords] = useState<DemoRecord[]>([]);
  const [errorsByWorkflow, setErrorsByWorkflow] = useState<ErrorsByWorkflow>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage>(null);
  const [savingRecordKey, setSavingRecordKey] = useState<string | null>(null);
  const [workflowFilter, setWorkflowFilter] =
    useState<WorkflowFilter>("all");
  const [approvalFilter, setApprovalFilter] =
    useState<ApprovalFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .map((record) => record.status.trim())
            .filter((status) => status),
        ),
      ).sort((first, second) => first.localeCompare(second)),
    [records],
  );

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      if (workflowFilter !== "all" && record.workflowKey !== workflowFilter) {
        return false;
      }

      if (
        approvalFilter === "approved" &&
        record.analysis_approved !== true
      ) {
        return false;
      }

      if (
        approvalFilter === "not-approved" &&
        record.analysis_approved === true
      ) {
        return false;
      }

      return matchesSearch(record, query);
    });
  }, [approvalFilter, records, searchTerm, workflowFilter]);

  const statusColumns = useMemo(
    () => buildStatusColumns(filteredRecords),
    [filteredRecords],
  );
  const groupedRecords = useMemo(
    () => groupRecordsByStatus(filteredRecords, statusColumns),
    [filteredRecords, statusColumns],
  );
  const approvedCount = records.filter(
    (record) => record.analysis_approved,
  ).length;
  const workflowErrorCount = Object.keys(errorsByWorkflow).length;

  const loadRecords = useCallback(async () => {
    setIsLoading(true);
    setErrorsByWorkflow({});

    const results = await Promise.all(
      workflows.map(async (workflow) => {
        try {
          const workflowRecords = await fetchWorkflowRecords(workflow);

          return {
            key: workflow.key,
            records: workflowRecords,
            error: null,
          };
        } catch (error) {
          return {
            key: workflow.key,
            records: [],
            error: getErrorMessage(error),
          };
        }
      }),
    );

    const nextErrors: ErrorsByWorkflow = {};

    results.forEach((result) => {
      if (result.error) {
        nextErrors[result.key] = result.error;
      }
    });

    setRecords(results.flatMap((result) => result.records));
    setErrorsByWorkflow(nextErrors);
    setLastLoadedAt(new Date().toLocaleString());
    setIsLoading(false);
  }, []);

  const handleStatusChange = useCallback(
    async (record: DemoRecord, status: string) => {
      const nextStatus = status.trim();

      if (!nextStatus || nextStatus === record.status.trim()) {
        return;
      }

      setActionMessage(null);
      setSavingRecordKey(record.boardKey);

      try {
        await updateRecordStatus(record, nextStatus);
        setActionMessage({
          kind: "success",
          text: `Moved "${record.title}" to ${nextStatus}.`,
        });
        await loadRecords();
      } catch (error) {
        setActionMessage({
          kind: "error",
          text: getErrorMessage(error),
        });
      } finally {
        setSavingRecordKey(null);
      }
    },
    [loadRecords],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadRecords();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadRecords]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            eyebrow="Internal"
            title="Workflow Board"
            description="A status-column board for reviewing saved Supabase records across Lead Follow-up, Recruitment Workflow, and Document Intake."
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:min-w-64">
            <button
              type="button"
              onClick={loadRecords}
              disabled={isLoading}
              className="w-full rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "Refresh board"}
            </button>
            <Link
              href="/internal/review-queue"
              className="mt-3 block rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Open review queue
            </Link>
            <Link
              href="/internal/demo-records"
              className="mt-3 block rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Open records viewer
            </Link>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {lastLoadedAt
                ? `Last refreshed: ${lastLoadedAt}`
                : "Board loads automatically on page open."}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
          <h2 className="text-base font-semibold text-white">
            Internal operations view
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This board groups saved Supabase records by status and allows quick
            status updates through the existing API routes. It does not add
            drag-and-drop, delete/export actions, auth, RLS changes, or public
            demo changes.
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <BoardMetric
            label="Total records"
            value={isLoading ? "Loading" : records.length}
          />
          <BoardMetric
            label="Visible records"
            value={isLoading ? "Loading" : filteredRecords.length}
          />
          <BoardMetric
            label="Status columns"
            value={isLoading ? "Loading" : statusColumns.length}
          />
          <BoardMetric
            label="Approved"
            value={isLoading ? "Loading" : approvedCount}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Board filters
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Filter the loaded records before they are grouped into status
                columns.
              </p>
            </div>

            {workflowErrorCount > 0 ? (
              <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {workflowErrorCount} source
                {workflowErrorCount === 1 ? "" : "s"} unavailable
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr]">
            <label className="text-sm font-semibold text-slate-200">
              Search
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Title, source, status, analysis..."
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </label>

            <label className="text-sm font-semibold text-slate-200">
              Workflow
              <select
                value={workflowFilter}
                onChange={(event) =>
                  setWorkflowFilter(event.target.value as WorkflowFilter)
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="all">All workflows</option>
                {workflows.map((workflow) => (
                  <option key={workflow.key} value={workflow.key}>
                    {workflow.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-200">
              Approval
              <select
                value={approvalFilter}
                onChange={(event) =>
                  setApprovalFilter(event.target.value as ApprovalFilter)
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="all">All approval states</option>
                <option value="approved">Approved</option>
                <option value="not-approved">Not approved</option>
              </select>
            </label>
          </div>
        </section>

        {actionMessage ? (
          <p
            className={
              actionMessage.kind === "success"
                ? "mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200"
                : "mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"
            }
          >
            {actionMessage.text}
          </p>
        ) : null}

        {workflowErrorCount > 0 ? (
          <div className="mt-6 grid gap-3">
            {workflows.map((workflow) => {
              const error = errorsByWorkflow[workflow.key];

              return error ? (
                <p
                  key={workflow.key}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"
                >
                  {workflow.label}: {error}
                </p>
              ) : null;
            })}
          </div>
        ) : null}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Status board
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Records are grouped by their saved status value.
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-cyan-200">
              {filteredRecords.length} visible
            </span>
          </div>

          {isLoading ? (
            <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              Loading workflow board...
            </p>
          ) : filteredRecords.length === 0 ? (
            <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
              No records match the current filters.
            </p>
          ) : (
            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              {groupedRecords.map((group) => (
                <div
                  key={group.status}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-base font-semibold text-white">
                      {group.status}
                    </h3>
                    <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {group.records.length}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3">
                    {group.records.map((record) => (
                      <WorkflowBoardCard
                        key={record.boardKey}
                        record={record}
                        statusOptions={statusOptions}
                        isSaving={savingRecordKey === record.boardKey}
                        onStatusChange={(status) =>
                          void handleStatusChange(record, status)
                        }
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
