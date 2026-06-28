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

type Workflow = (typeof workflows)[number];
type WorkflowKey = Workflow["key"];
type WorkflowFilter = "all" | WorkflowKey;
type ApprovalFilter = "all" | "approved" | "not-approved";

type DemoRecord = {
  queueKey: string;
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

type ReviewDraft = {
  status: string;
  analysis_approved: boolean;
};

type ReviewUpdate = {
  status?: string;
  analysis_approved?: boolean;
};

type DraftsByRecord = Record<string, ReviewDraft>;
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

  return "Unknown error while loading review records.";
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

function truncateText(value: string, maxLength = 220) {
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

function normalizeDemoRecord(
  value: unknown,
  index: number,
  workflow: Workflow,
): DemoRecord {
  const record = isObjectRecord(value) ? value : {};
  const id = getString(record.id, `${workflow.key}-record-${index}`);

  return {
    queueKey: `${workflow.key}:${id}`,
    id,
    workflowKey: workflow.key,
    workflowLabel: workflow.label,
    apiEndpoint: workflow.apiEndpoint,
    demo_type: getString(record.demo_type, "unknown"),
    title: getString(record.title, "Untitled record"),
    status: getString(record.status, "Unknown"),
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

function buildDraft(record: DemoRecord): ReviewDraft {
  return {
    status: record.status,
    analysis_approved: record.analysis_approved,
  };
}

function buildDrafts(records: DemoRecord[]): DraftsByRecord {
  return records.reduce<DraftsByRecord>((drafts, record) => {
    drafts[record.queueKey] = buildDraft(record);
    return drafts;
  }, {});
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

async function updateReviewRecord(record: DemoRecord, updates: ReviewUpdate) {
  const requestBody: ReviewUpdate = {};

  if (updates.status !== undefined) {
    requestBody.status = updates.status.trim();
  }

  if (updates.analysis_approved !== undefined) {
    requestBody.analysis_approved = updates.analysis_approved;
  }

  const response = await fetch(
    `${getApiEndpointForDemoType(record)}?id=${encodeURIComponent(record.id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    },
  );

  let responseBody: unknown;

  try {
    responseBody = await response.json();
  } catch {
    throw new Error("The API response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error(getApiError(responseBody, "The update request failed."));
  }

  if (!isObjectRecord(responseBody) || responseBody.ok !== true) {
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

function QueueMetric({
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

function ReviewQueueCard({
  record,
  draft,
  isSelected,
  isSaving,
  onDraftChange,
  onSave,
  onSelectedChange,
}: {
  record: DemoRecord;
  draft: ReviewDraft;
  isSelected: boolean;
  isSaving: boolean;
  onDraftChange: (updates: Partial<ReviewDraft>) => void;
  onSave: () => void;
  onSelectedChange: (selected: boolean) => void;
}) {
  const nextStatus = draft.status.trim();
  const hasChanges =
    nextStatus !== record.status ||
    draft.analysis_approved !== record.analysis_approved;

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex gap-3">
          <label className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
            <span className="sr-only">Select {record.title}</span>
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(event) => onSelectedChange(event.target.checked)}
              disabled={isSaving}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <div>
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

            <h3 className="mt-3 text-lg font-semibold text-white">
              {record.title}
            </h3>
            <p className="mt-1 text-sm text-slate-400">
              Source: {record.source || "Not set"}
            </p>
          </div>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2 lg:min-w-80">
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Status
            </p>
            <p className="mt-1 text-slate-200">{record.status}</p>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Latest update
            </p>
            <p className="mt-1 text-slate-200">
              {formatDate(getLatestDate(record))}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
          Analysis summary
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {getAnalysisSummary(record.analysis)}
        </p>
      </div>

      <div className="mt-4 grid gap-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4 lg:grid-cols-[1fr_auto_auto] lg:items-end">
        <label className="text-sm font-semibold text-slate-200">
          Update status
          <input
            type="text"
            value={draft.status}
            onChange={(event) =>
              onDraftChange({
                status: event.target.value,
              })
            }
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
          />
        </label>

        <button
          type="button"
          onClick={() =>
            onDraftChange({
              analysis_approved: !draft.analysis_approved,
            })
          }
          disabled={isSaving}
          className={
            draft.analysis_approved
              ? "rounded-lg border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              : "rounded-lg border border-amber-400/50 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-300 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          }
        >
          {draft.analysis_approved ? "Set not approved" : "Set approved"}
        </button>

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving || !hasChanges || !nextStatus}
          className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save review update"}
        </button>
      </div>
    </article>
  );
}

export default function ReviewQueueClient() {
  const [records, setRecords] = useState<DemoRecord[]>([]);
  const [drafts, setDrafts] = useState<DraftsByRecord>({});
  const [errorsByWorkflow, setErrorsByWorkflow] = useState<ErrorsByWorkflow>(
    {},
  );
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage>(null);
  const [savingRecordKey, setSavingRecordKey] = useState<string | null>(null);
  const [selectedRecordKeys, setSelectedRecordKeys] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState("");
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  const [workflowFilter, setWorkflowFilter] =
    useState<WorkflowFilter>("all");
  const [approvalFilter, setApprovalFilter] =
    useState<ApprovalFilter>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(
          records
            .map((record) => record.status)
            .filter((status) => status.trim()),
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

      if (statusFilter !== "all" && record.status !== statusFilter) {
        return false;
      }

      return matchesSearch(record, query);
    });
  }, [approvalFilter, records, searchTerm, statusFilter, workflowFilter]);

  const selectedRecordKeySet = useMemo(
    () => new Set(selectedRecordKeys),
    [selectedRecordKeys],
  );
  const selectedRecords = useMemo(
    () =>
      records.filter((record) => selectedRecordKeySet.has(record.queueKey)),
    [records, selectedRecordKeySet],
  );
  const selectedVisibleCount = filteredRecords.filter((record) =>
    selectedRecordKeySet.has(record.queueKey),
  ).length;
  const allVisibleSelected =
    filteredRecords.length > 0 &&
    selectedVisibleCount === filteredRecords.length;
  const hasSelectedRecords = selectedRecords.length > 0;
  const isAnySaving = Boolean(savingRecordKey) || isBulkSaving;
  const approvedCount = records.filter(
    (record) => record.analysis_approved,
  ).length;
  const needsReviewCount = records.length - approvedCount;
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

    const nextRecords = results.flatMap((result) => result.records);
    const nextErrors: ErrorsByWorkflow = {};

    results.forEach((result) => {
      if (result.error) {
        nextErrors[result.key] = result.error;
      }
    });

    const nextStatuses = new Set(nextRecords.map((record) => record.status));

    setRecords(nextRecords);
    setDrafts(buildDrafts(nextRecords));
    setSelectedRecordKeys([]);
    setErrorsByWorkflow(nextErrors);
    setStatusFilter((current) =>
      current === "all" || nextStatuses.has(current) ? current : "all",
    );
    setLastLoadedAt(new Date().toLocaleString());
    setIsLoading(false);
  }, []);

  const handleDraftChange = useCallback(
    (record: DemoRecord, updates: Partial<ReviewDraft>) => {
      setDrafts((currentDrafts) => ({
        ...currentDrafts,
        [record.queueKey]: {
          ...(currentDrafts[record.queueKey] ?? buildDraft(record)),
          ...updates,
        },
      }));
    },
    [],
  );

  const handleSelectRecord = useCallback(
    (record: DemoRecord, selected: boolean) => {
      setSelectedRecordKeys((currentKeys) => {
        if (selected) {
          return currentKeys.includes(record.queueKey)
            ? currentKeys
            : [...currentKeys, record.queueKey];
        }

        return currentKeys.filter((key) => key !== record.queueKey);
      });
    },
    [],
  );

  const handleSelectAllVisible = useCallback(
    (selected: boolean) => {
      const visibleKeys = filteredRecords.map((record) => record.queueKey);

      setSelectedRecordKeys((currentKeys) => {
        if (selected) {
          return Array.from(new Set([...currentKeys, ...visibleKeys]));
        }

        const visibleKeySet = new Set(visibleKeys);

        return currentKeys.filter((key) => !visibleKeySet.has(key));
      });
    },
    [filteredRecords],
  );

  const handleSaveRecord = useCallback(
    async (record: DemoRecord) => {
      const draft = drafts[record.queueKey] ?? buildDraft(record);
      const trimmedStatus = draft.status.trim();

      if (!trimmedStatus) {
        setActionMessage({
          kind: "error",
          text: "Status cannot be blank.",
        });
        return;
      }

      setActionMessage(null);
      setSavingRecordKey(record.queueKey);

      try {
        await updateReviewRecord(record, {
          status: trimmedStatus,
          analysis_approved: draft.analysis_approved,
        });
        setActionMessage({
          kind: "success",
          text: `Updated "${record.title}" in the review queue.`,
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
    [drafts, loadRecords],
  );

  const handleBulkUpdate = useCallback(
    async (updates: ReviewUpdate, actionLabel: string) => {
      if (selectedRecords.length === 0) {
        setActionMessage({
          kind: "error",
          text: "Select at least one record before applying a bulk action.",
        });
        return;
      }

      const nextUpdates: ReviewUpdate = {};

      if (updates.status !== undefined) {
        const nextStatus = updates.status.trim();

        if (!nextStatus) {
          setActionMessage({
            kind: "error",
            text: "Bulk status cannot be blank.",
          });
          return;
        }

        nextUpdates.status = nextStatus;
      }

      if (updates.analysis_approved !== undefined) {
        nextUpdates.analysis_approved = updates.analysis_approved;
      }

      if (Object.keys(nextUpdates).length === 0) {
        setActionMessage({
          kind: "error",
          text: "Choose a bulk action before saving.",
        });
        return;
      }

      const confirmed = window.confirm(
        `Apply "${actionLabel}" to ${selectedRecords.length} selected record${
          selectedRecords.length === 1 ? "" : "s"
        }?`,
      );

      if (!confirmed) {
        return;
      }

      setActionMessage(null);
      setIsBulkSaving(true);

      const results = await Promise.all(
        selectedRecords.map(async (record) => {
          try {
            await updateReviewRecord(record, nextUpdates);

            return {
              ok: true as const,
              title: record.title,
              error: null,
            };
          } catch (error) {
            return {
              ok: false as const,
              title: record.title,
              error: getErrorMessage(error),
            };
          }
        }),
      );

      const updatedCount = results.filter((result) => result.ok).length;
      const failedResults = results.filter((result) => !result.ok);
      const failedCount = failedResults.length;
      const firstFailure = failedResults[0];

      setActionMessage({
        kind: failedCount > 0 ? "error" : "success",
        text:
          failedCount > 0
            ? `Bulk update finished: ${updatedCount} updated, ${failedCount} failed.${
                firstFailure
                  ? ` First failure: ${firstFailure.title} - ${firstFailure.error}`
                  : ""
              }`
            : `Bulk update complete: ${updatedCount} record${
                updatedCount === 1 ? "" : "s"
              } updated.`,
      });

      setIsBulkSaving(false);
      await loadRecords();
    },
    [loadRecords, selectedRecords],
  );

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
            title="Review Queue"
            description="A cross-workflow review surface for saved Supabase records from Lead Follow-up, Recruitment Workflow, and Document Intake. It is for internal cleanup and review only."
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:min-w-60">
            <button
              type="button"
              onClick={loadRecords}
              disabled={isLoading}
              className="w-full rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "Refresh queue"}
            </button>
            <Link
              href="/internal/demo-records"
              className="mt-3 block rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Open records viewer
            </Link>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {lastLoadedAt
                ? `Last refreshed: ${lastLoadedAt}`
                : "Queue loads automatically on page open."}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
          <h2 className="text-base font-semibold text-white">
            Internal review utility
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            This queue updates only review status and workflow status through
            the existing API routes. It does not edit raw input, full analysis
            JSON, browser localStorage, RLS policies, or Supabase keys.
          </p>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QueueMetric
            label="Total records"
            value={isLoading ? "Loading" : records.length}
          />
          <QueueMetric
            label="Visible records"
            value={isLoading ? "Loading" : filteredRecords.length}
          />
          <QueueMetric
            label="Approved"
            value={isLoading ? "Loading" : approvedCount}
          />
          <QueueMetric
            label="Needs review"
            value={isLoading ? "Loading" : needsReviewCount}
          />
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Queue filters
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Search and filter the records currently loaded from the three
                Supabase sync APIs.
              </p>
            </div>

            {workflowErrorCount > 0 ? (
              <span className="w-fit rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300">
                {workflowErrorCount} source
                {workflowErrorCount === 1 ? "" : "s"} unavailable
              </span>
            ) : null}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
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

            <label className="text-sm font-semibold text-slate-200">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="all">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Bulk review actions
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Apply approval or status updates to selected records. Each
                record still saves through its own workflow API route.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={(event) =>
                    handleSelectAllVisible(event.target.checked)
                  }
                  disabled={isAnySaving || filteredRecords.length === 0}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 accent-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                />
                Select all visible
              </label>

              <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-cyan-200">
                {selectedRecords.length} selected
              </span>
              {selectedVisibleCount !== selectedRecords.length ? (
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-slate-400">
                  {selectedVisibleCount} visible selected
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[auto_auto_1fr_auto] lg:items-end">
            <button
              type="button"
              onClick={() =>
                void handleBulkUpdate(
                  {
                    analysis_approved: true,
                  },
                  "mark selected as approved",
                )
              }
              disabled={!hasSelectedRecords || isAnySaving}
              className="rounded-lg border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark selected as approved
            </button>

            <button
              type="button"
              onClick={() =>
                void handleBulkUpdate(
                  {
                    analysis_approved: false,
                  },
                  "mark selected as not approved",
                )
              }
              disabled={!hasSelectedRecords || isAnySaving}
              className="rounded-lg border border-amber-400/50 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:border-amber-300 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Mark selected as not approved
            </button>

            <label className="text-sm font-semibold text-slate-200">
              Bulk status
              <input
                type="text"
                value={bulkStatus}
                onChange={(event) => setBulkStatus(event.target.value)}
                list="review-queue-status-options"
                placeholder="Enter status"
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
              <datalist id="review-queue-status-options">
                {statusOptions.map((status) => (
                  <option key={status} value={status} />
                ))}
              </datalist>
            </label>

            <button
              type="button"
              onClick={() =>
                void handleBulkUpdate(
                  {
                    status: bulkStatus,
                  },
                  `set selected status to "${bulkStatus.trim()}"`,
                )
              }
              disabled={!hasSelectedRecords || isAnySaving || !bulkStatus.trim()}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBulkSaving ? "Applying..." : "Set selected status"}
            </button>
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
                Review queue
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Compact review cards across all three workflows.
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-cyan-200">
              {filteredRecords.length} visible
            </span>
          </div>

          {isLoading ? (
            <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              Loading review queue...
            </p>
          ) : filteredRecords.length === 0 ? (
            <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
              No records match the current filters.
            </p>
          ) : (
            <div className="mt-5 grid gap-4">
              {filteredRecords.map((record) => (
                <ReviewQueueCard
                  key={record.queueKey}
                  record={record}
                  draft={drafts[record.queueKey] ?? buildDraft(record)}
                  isSelected={selectedRecordKeySet.has(record.queueKey)}
                  isSaving={savingRecordKey === record.queueKey || isBulkSaving}
                  onDraftChange={(updates) =>
                    handleDraftChange(record, updates)
                  }
                  onSave={() => void handleSaveRecord(record)}
                  onSelectedChange={(selected) =>
                    handleSelectRecord(record, selected)
                  }
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
