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

const csvColumns = [
  "demo_type",
  "title",
  "status",
  "source",
  "analysis_approved",
  "created_at",
  "updated_at",
  "raw_input",
  "analysis",
] as const;

type SectionKey = (typeof recordSections)[number]["key"];
type RecordSection = (typeof recordSections)[number];

type DemoRecord = {
  id: string;
  demo_type: string;
  title: string;
  status: string;
  source: string | null;
  internal_notes: string | null;
  raw_input: unknown;
  analysis: unknown;
  analysis_approved: boolean;
  created_at: string | null;
  updated_at: string | null;
};

type EditFormState = {
  title: string;
  status: string;
  source: string;
  analysis_approved: boolean;
  internal_notes: string;
};

type RecordsBySection = Record<SectionKey, DemoRecord[]>;
type ErrorsBySection = Partial<Record<SectionKey, string>>;
type ActionMessage = {
  kind: "success" | "error";
  text: string;
} | null;

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
    demo_type: getString(record.demo_type, "unknown"),
    title: getString(record.title, "Untitled record"),
    status: getString(record.status, "Unknown"),
    source: getNullableString(record.source),
    internal_notes: getNullableString(record.internal_notes),
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

function buildEditForm(record: DemoRecord): EditFormState {
  return {
    title: record.title,
    status: record.status,
    source: record.source ?? "",
    analysis_approved: record.analysis_approved,
    internal_notes: record.internal_notes ?? "",
  };
}

function buildUpdatePayload(form: EditFormState) {
  return {
    title: form.title,
    status: form.status,
    source: form.source.trim() ? form.source : null,
    analysis_approved: form.analysis_approved,
    internal_notes: form.internal_notes.trim() ? form.internal_notes : null,
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

async function deleteRecordFromApi(endpoint: string, id: string) {
  const response = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The API response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error(getApiError(body, "The delete request failed."));
  }

  if (!isObjectRecord(body) || body.ok !== true) {
    throw new Error("The API response did not confirm the delete action.");
  }
}

async function updateRecordInApi(
  endpoint: string,
  id: string,
  updates: ReturnType<typeof buildUpdatePayload>,
) {
  const response = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

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

function formatSummaryDate(value: string | null) {
  if (!value) {
    return "No records yet";
  }

  return formatDate(value);
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

function buildExportRecord(record: DemoRecord) {
  return {
    demo_type: record.demo_type,
    title: record.title,
    status: record.status,
    source: record.source,
    raw_input: record.raw_input,
    analysis: record.analysis,
    analysis_approved: record.analysis_approved,
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

function downloadTextFile(fileName: string, contents: string, type: string) {
  const blob = new Blob([contents], {
    type,
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJsonFile(fileName: string, records: DemoRecord[]) {
  const exportPayload = records.map(buildExportRecord);

  downloadTextFile(
    fileName,
    JSON.stringify(exportPayload, null, 2),
    "application/json",
  );
}

function getCsvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  return JSON.stringify(value);
}

function escapeCsvValue(value: unknown) {
  const text = getCsvValue(value);
  const escapedText = text.replace(/"/g, '""');

  if (/[",\r\n]/.test(text)) {
    return `"${escapedText}"`;
  }

  return escapedText;
}

function buildCsvFile(records: DemoRecord[]) {
  const rows = records.map((record) => [
    record.demo_type,
    record.title,
    record.status,
    record.source,
    record.analysis_approved,
    record.created_at,
    record.updated_at,
    record.raw_input,
    record.analysis,
  ]);

  return [
    csvColumns.join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(",")),
  ].join("\n");
}

function downloadCsvFile(fileName: string, records: DemoRecord[]) {
  downloadTextFile(fileName, buildCsvFile(records), "text/csv;charset=utf-8");
}

function buildExportFileName(scope: string, extension: "csv" | "json") {
  const date = new Date().toISOString().slice(0, 10);

  return `demo-records-${scope}-${date}.${extension}`;
}

function SummaryCard({
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

function RecordCard({
  record,
  editForm,
  isDeleting,
  isEditing,
  isSaving,
  onCancelEdit,
  onDelete,
  onEdit,
  onEditFormChange,
  onSaveEdit,
}: {
  record: DemoRecord;
  editForm: EditFormState | null;
  isDeleting: boolean;
  isEditing: boolean;
  isSaving: boolean;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onEditFormChange: (updates: Partial<EditFormState>) => void;
  onSaveEdit: () => void;
}) {
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
          <button
            type="button"
            onClick={onEdit}
            disabled={isDeleting || isSaving}
            className="rounded-full border border-cyan-400/40 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isDeleting || isSaving}
            className="rounded-full border border-rose-400/40 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:border-rose-300 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
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

      {isEditing && editForm ? (
        <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-slate-200">
              Title
              <input
                type="text"
                value={editForm.title}
                onChange={(event) =>
                  onEditFormChange({
                    title: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="text-sm font-semibold text-slate-200">
              Status
              <input
                type="text"
                value={editForm.status}
                onChange={(event) =>
                  onEditFormChange({
                    status: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="text-sm font-semibold text-slate-200">
              Source
              <input
                type="text"
                value={editForm.source}
                onChange={(event) =>
                  onEditFormChange({
                    source: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>

            <label className="flex items-center gap-3 pt-7 text-sm font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={editForm.analysis_approved}
                onChange={(event) =>
                  onEditFormChange({
                    analysis_approved: event.target.checked,
                  })
                }
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-cyan-400"
              />
              analysis_approved
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-200">
            Internal notes
            <textarea
              value={editForm.internal_notes}
              onChange={(event) =>
                onEditFormChange({
                  internal_notes: event.target.value,
                })
              }
              rows={3}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <p className="mt-3 text-xs leading-5 text-slate-400">
            Saves only this Supabase record. Demo localStorage is not changed.
          </p>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={isSaving}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSaving}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

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

export default function DemoRecordsClient() {
  const [recordsBySection, setRecordsBySection] =
    useState<RecordsBySection>(buildEmptyRecords);
  const [errorsBySection, setErrorsBySection] = useState<ErrorsBySection>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage>(null);
  const [deletingRecordId, setDeletingRecordId] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [savingRecordId, setSavingRecordId] = useState<string | null>(null);

  const allRecords = recordSections.flatMap(
    (section) => recordsBySection[section.key],
  );
  const approvedAnalysisCount = allRecords.filter(
    (record) => record.analysis_approved,
  ).length;
  const latestUpdatedAt = getLatestUpdatedAt(allRecords);
  const summaryValues = [
    {
      label: "Total records",
      value: isLoading ? "Loading" : allRecords.length,
    },
    {
      label: "Lead records",
      value: isLoading ? "Loading" : recordsBySection.lead.length,
    },
    {
      label: "Recruitment records",
      value: isLoading ? "Loading" : recordsBySection.recruitment.length,
    },
    {
      label: "Document records",
      value: isLoading ? "Loading" : recordsBySection.document.length,
    },
    {
      label: "Approved analyses",
      value: isLoading ? "Loading" : approvedAnalysisCount,
    },
    {
      label: "Latest update",
      value: isLoading ? "Loading" : formatSummaryDate(latestUpdatedAt),
    },
  ];

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

  const handleDeleteRecord = useCallback(
    async (section: RecordSection, record: DemoRecord) => {
      const confirmed = window.confirm(
        `Delete "${record.title}" from Supabase? This does not delete localStorage demo data.`,
      );

      if (!confirmed) {
        return;
      }

      if (editingRecordId === record.id) {
        setEditingRecordId(null);
        setEditForm(null);
      }

      setActionMessage(null);
      setDeletingRecordId(record.id);

      try {
        await deleteRecordFromApi(section.endpoint, record.id);
        setActionMessage({
          kind: "success",
          text: `Deleted "${record.title}" from Supabase.`,
        });
        await loadRecords();
      } catch (error) {
        setActionMessage({
          kind: "error",
          text: getErrorMessage(error),
        });
      } finally {
        setDeletingRecordId(null);
      }
    },
    [editingRecordId, loadRecords],
  );

  const handleStartEdit = useCallback((record: DemoRecord) => {
    setActionMessage(null);
    setEditingRecordId(record.id);
    setEditForm(buildEditForm(record));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingRecordId(null);
    setEditForm(null);
  }, []);

  const handleEditFormChange = useCallback(
    (updates: Partial<EditFormState>) => {
      setEditForm((current) =>
        current
          ? {
              ...current,
              ...updates,
            }
          : current,
      );
    },
    [],
  );

  const handleSaveEdit = useCallback(
    async (section: RecordSection, record: DemoRecord) => {
      if (!editForm || editingRecordId !== record.id) {
        return;
      }

      const confirmed = window.confirm(
        `Save changes to "${record.title}" in Supabase? This does not update localStorage demo data.`,
      );

      if (!confirmed) {
        return;
      }

      setActionMessage(null);
      setSavingRecordId(record.id);

      try {
        await updateRecordInApi(
          section.endpoint,
          record.id,
          buildUpdatePayload(editForm),
        );
        setActionMessage({
          kind: "success",
          text: `Updated "${editForm.title || record.title}" in Supabase.`,
        });
        setEditingRecordId(null);
        setEditForm(null);
        await loadRecords();
      } catch (error) {
        setActionMessage({
          kind: "error",
          text: getErrorMessage(error),
        });
      } finally {
        setSavingRecordId(null);
      }
    },
    [editForm, editingRecordId, loadRecords],
  );

  const handleExportRecords = useCallback(
    (scope: string, records: DemoRecord[]) => {
      if (records.length === 0) {
        setActionMessage({
          kind: "error",
          text: "There are no loaded records to export for that selection.",
        });
        return;
      }

      downloadJsonFile(buildExportFileName(scope, "json"), records);
      setActionMessage({
        kind: "success",
        text: `Exported ${records.length} ${
          records.length === 1 ? "record" : "records"
        } as JSON.`,
      });
    },
    [],
  );

  const handleExportCsvRecords = useCallback(
    (scope: string, records: DemoRecord[]) => {
      if (records.length === 0) {
        setActionMessage({
          kind: "error",
          text: "There are no loaded records to export for that selection.",
        });
        return;
      }

      downloadCsvFile(buildExportFileName(scope, "csv"), records);
      setActionMessage({
        kind: "success",
        text: `Exported ${records.length} ${
          records.length === 1 ? "record" : "records"
        } as CSV.`,
      });
    },
    [],
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
            title="Demo Records"
            description="A small development viewer for checking and cleaning up optional Supabase persistence through the existing internal API routes. This page does not expose Supabase keys."
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
            sync. Delete only removes Supabase records for cleanup; it does not
            touch browser localStorage, add auth, change RLS, or connect
            directly to Supabase from the browser.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Database summary
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Counts are calculated from the records currently loaded on this
                page.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {summaryValues.map((item) => (
              <SummaryCard
                key={item.label}
                label={item.label}
                value={item.value}
              />
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Export loaded records
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                Downloads JSON or CSV from the records currently loaded on this
                page. Section exports are disabled when that workflow has no
                loaded records.
              </p>
            </div>

            <div className="grid gap-4 lg:min-w-[32rem]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  JSON
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleExportRecords("all", allRecords)}
                    disabled={isLoading || allRecords.length === 0}
                    className="rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Export all records as JSON
                  </button>
                  {recordSections.map((section) => {
                    const records = recordsBySection[section.key];

                    return (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() =>
                          handleExportRecords(section.key, records)
                        }
                        disabled={isLoading || records.length === 0}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {section.key === "lead"
                          ? "Export Lead records as JSON"
                          : section.key === "recruitment"
                            ? "Export Recruitment records as JSON"
                            : "Export Document Intake records as JSON"}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  CSV
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleExportCsvRecords("all", allRecords)}
                    disabled={isLoading || allRecords.length === 0}
                    className="rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Export all records as CSV
                  </button>
                  {recordSections.map((section) => {
                    const records = recordsBySection[section.key];

                    return (
                      <button
                        key={section.key}
                        type="button"
                        onClick={() =>
                          handleExportCsvRecords(section.key, records)
                        }
                        disabled={isLoading || records.length === 0}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {section.key === "lead"
                          ? "Export Lead records as CSV"
                          : section.key === "recruitment"
                            ? "Export Recruitment records as CSV"
                            : "Export Document Intake records as CSV"}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
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
                      <RecordCard
                        key={record.id}
                        record={record}
                        editForm={
                          editingRecordId === record.id ? editForm : null
                        }
                        isDeleting={deletingRecordId === record.id}
                        isEditing={editingRecordId === record.id}
                        isSaving={savingRecordId === record.id}
                        onCancelEdit={handleCancelEdit}
                        onDelete={() => void handleDeleteRecord(section, record)}
                        onEdit={() => handleStartEdit(record)}
                        onEditFormChange={handleEditFormChange}
                        onSaveEdit={() => void handleSaveEdit(section, record)}
                      />
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
