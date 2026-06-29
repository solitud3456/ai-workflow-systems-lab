"use client";

import { FormEvent, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import AnalysisReviewCard from "@/components/demo/AnalysisReviewCard";
import CopyableOutputBox from "@/components/demo/CopyableOutputBox";
import DashboardHeader from "@/components/demo/DashboardHeader";
import DemoPanel from "@/components/demo/DemoPanel";
import EmptyState from "@/components/demo/EmptyState";
import MetricCard from "@/components/demo/MetricCard";
import StatusSelect from "@/components/demo/StatusSelect";
import type {
  CompanyWorkflowModuleConfig,
  WorkflowFieldConfig,
  WorkflowRecord,
} from "@/lib/companyWorkflowModules";

type SupabaseSyncMessage = {
  type: "success" | "error";
  text: string;
};

type DemoRecordRow = {
  id: string;
  title: string | null;
  status: string | null;
  source: string | null;
  raw_input: string | null;
  internal_notes: string | null;
  analysis: unknown;
  analysis_approved: boolean | null;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function formatFieldLabel(field: string) {
  return field
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/^./, (letter) => letter.toUpperCase());
}

function getRecordValue(record: WorkflowRecord, field: string) {
  const value = record[field];

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return typeof value === "string" ? value : "";
}

function getRecordTitle(
  config: CompanyWorkflowModuleConfig,
  record: WorkflowRecord,
) {
  return (
    getRecordValue(record, config.titleField).trim() ||
    `Untitled ${config.recordNoun}`
  );
}

function getRecordSource(
  config: CompanyWorkflowModuleConfig,
  record: WorkflowRecord,
) {
  return getRecordValue(record, config.sourceField).trim() || null;
}

function getTitleSyncIssue(
  config: CompanyWorkflowModuleConfig,
  record: WorkflowRecord,
) {
  const title = getRecordTitle(config, record).trim();

  if (!title || title.startsWith("Untitled ")) {
    return "A display title is required before Supabase save.";
  }

  if (title.length < 3) {
    return "The display title must be at least 3 characters.";
  }

  return null;
}

function parseRawInput(rawInput: string | null): Record<string, unknown> {
  if (!rawInput) {
    return {};
  }

  try {
    const parsed = JSON.parse(rawInput) as unknown;
    return isObjectRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function buildFallbackId(index: number) {
  return Date.now() + index;
}

function isValidStatus(
  config: CompanyWorkflowModuleConfig,
  status: unknown,
): status is string {
  return (
    typeof status === "string" &&
    config.statuses.some((option) => option === status)
  );
}

function buildRawInput(
  config: CompanyWorkflowModuleConfig,
  record: WorkflowRecord,
) {
  const rawInput: Record<string, unknown> = {
    id: record.id,
    status: record.status,
  };

  config.fields.forEach((field) => {
    rawInput[field.name] = record[field.name] ?? "";
  });

  return rawInput;
}

function mapRecordToDemoRecord(
  config: CompanyWorkflowModuleConfig,
  record: WorkflowRecord,
) {
  return {
    title: getRecordTitle(config, record),
    status: record.status,
    source: getRecordSource(config, record),
    raw_input: JSON.stringify(buildRawInput(config, record)),
    internal_notes: getRecordValue(record, config.internalNotesField),
    analysis: record.analysis ?? null,
    analysis_approved: record.analysisApproved,
  };
}

function mapDemoRecordToWorkflowRecord(
  config: CompanyWorkflowModuleConfig,
  row: DemoRecordRow,
  index: number,
  usedIds: Set<number>,
): WorkflowRecord {
  const rawRecord = parseRawInput(row.raw_input);
  const rawId = getNumber(rawRecord.id);
  let id = rawId ?? buildFallbackId(index);

  while (usedIds.has(id)) {
    id += 1;
  }

  usedIds.add(id);

  const record: WorkflowRecord = {
    id,
    status: isValidStatus(config, row.status)
      ? row.status
      : isValidStatus(config, rawRecord.status)
        ? rawRecord.status
        : (config.statuses[0] ?? "New"),
    analysis: isObjectRecord(row.analysis) ? row.analysis : undefined,
    analysisApproved: Boolean(row.analysis_approved && isObjectRecord(row.analysis)),
  };

  config.fields.forEach((field) => {
    const value = rawRecord[field.name];
    record[field.name] = typeof value === "string" ? value : "";
  });

  if (!getRecordValue(record, config.titleField)) {
    record[config.titleField] = row.title || `Supabase ${config.recordNoun}`;
  }

  if (!getRecordValue(record, config.sourceField) && row.source) {
    record[config.sourceField] = row.source;
  }

  record[config.internalNotesField] =
    row.internal_notes || getRecordValue(record, config.internalNotesField);

  return record;
}

function getSyncErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isObjectRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown Supabase sync error.";
}

function getApiErrorMessage(responseBody: unknown, fallback: string) {
  if (isObjectRecord(responseBody) && typeof responseBody.error === "string") {
    return responseBody.error;
  }

  return fallback;
}

function renderFieldInput(field: WorkflowFieldConfig) {
  const baseClass =
    "mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400";

  if (field.type === "textarea") {
    return (
      <textarea
        id={field.name}
        name={field.name}
        required={field.required}
        rows={field.rows ?? 4}
        placeholder={field.placeholder}
        className={baseClass}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        id={field.name}
        name={field.name}
        required={field.required}
        className={baseClass}
      >
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      id={field.name}
      name={field.name}
      type={field.type}
      required={field.required}
      placeholder={field.placeholder}
      className={baseClass}
    />
  );
}

function stringifyOutput(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (isObjectRecord(item)) {
          const task = getString(item.task);
          const owner = getString(item.owner);
          const deadline = getString(item.deadline);
          const details = [owner ? `Owner: ${owner}` : "", deadline ? `Deadline: ${deadline}` : ""]
            .filter(Boolean)
            .join(" | ");

          return details ? `${task || JSON.stringify(item)} (${details})` : task || JSON.stringify(item);
        }

        return String(item);
      })
      .join("\n");
  }

  if (isObjectRecord(value)) {
    return JSON.stringify(value, null, 2);
  }

  return value === undefined || value === null ? "" : String(value);
}

function renderAnalysisValue(value: unknown) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <p className="text-slate-500">None listed.</p>;
    }

    return (
      <ul className="space-y-2">
        {value.map((item, index) => (
          <li key={`${String(item)}-${index}`} className="text-slate-300">
            {isObjectRecord(item) ? stringifyOutput([item]) : String(item)}
          </li>
        ))}
      </ul>
    );
  }

  if (typeof value === "boolean") {
    return <p>{value ? "Yes" : "No"}</p>;
  }

  if (isObjectRecord(value)) {
    return (
      <pre className="whitespace-pre-wrap text-xs leading-5 text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  }

  return <p>{value === undefined || value === null ? "Not provided." : String(value)}</p>;
}

export default function CompanyWorkflowDemo({
  config,
}: {
  config: CompanyWorkflowModuleConfig;
}) {
  const [records, setRecords] =
    useState<WorkflowRecord[]>(config.initialRecords);
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(
    config.initialRecords[0]?.id ?? null,
  );
  const [analysisJsonByRecordId, setAnalysisJsonByRecordId] = useState<
    Record<number, string>
  >({});
  const [storageReady, setStorageReady] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] =
    useState<SupabaseSyncMessage | null>(null);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);

  useEffect(() => {
    const savedRecords = window.localStorage.getItem(config.storageKey);
    let animationFrameId: number | undefined;

    if (savedRecords) {
      try {
        const parsedRecords = JSON.parse(savedRecords) as unknown;

        if (!Array.isArray(parsedRecords)) {
          throw new Error("Saved workflow data is not an array.");
        }

        const normalizedRecords = (parsedRecords as WorkflowRecord[]).map(
          (record) => ({
            ...record,
            analysisApproved: record.analysisApproved ?? false,
          }),
        );

        animationFrameId = window.requestAnimationFrame(() => {
          setRecords(normalizedRecords);
          setSelectedRecordId(normalizedRecords[0]?.id ?? null);
          setStorageReady(true);
        });
      } catch {
        window.localStorage.removeItem(config.storageKey);
        animationFrameId = window.requestAnimationFrame(() => {
          setStorageReady(true);
        });
      }
    } else {
      animationFrameId = window.requestAnimationFrame(() => {
        setStorageReady(true);
      });
    }

    return () => {
      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [config.storageKey]);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(config.storageKey, JSON.stringify(records));
  }, [config.storageKey, records, storageReady]);

  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? records[0];
  const statusCounts = config.statuses.map((status) => ({
    status,
    count: records.filter((record) => record.status === status).length,
  }));
  const analyzedCount = records.filter((record) => record.analysis).length;
  const reviewedCount = records.filter(
    (record) => record.analysisApproved,
  ).length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newRecord: WorkflowRecord = {
      id: Date.now(),
      status: config.statuses[0] ?? "New",
      analysisApproved: false,
    };

    for (const field of config.fields) {
      const value = String(formData.get(field.name) || "").trim();

      if (field.required && !value) {
        window.alert(`${field.label} is required.`);
        return;
      }

      newRecord[field.name] = value;
    }

    setRecords((currentRecords) => [newRecord, ...currentRecords]);
    setSelectedRecordId(newRecord.id);
    event.currentTarget.reset();
  }

  function updateRecordStatus(id: number, status: string) {
    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === id ? { ...record, status } : record,
      ),
    );
  }

  function updateInternalNotes(id: number, internalNotes: string) {
    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === id
          ? { ...record, [config.internalNotesField]: internalNotes }
          : record,
      ),
    );
  }

  function saveAnalysis(id: number, rawJson: string) {
    let parsedAnalysis: unknown;

    try {
      parsedAnalysis = JSON.parse(rawJson);
    } catch {
      window.alert("The pasted AI output is not valid JSON. Try again.");
      return;
    }

    if (!isObjectRecord(parsedAnalysis)) {
      window.alert("The pasted AI output is not valid JSON. Try again.");
      return;
    }

    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === id
          ? {
              ...record,
              analysis: parsedAnalysis,
              analysisApproved: false,
            }
          : record,
      ),
    );
  }

  function approveAnalysis(id: number) {
    setRecords((currentRecords) =>
      currentRecords.map((record) =>
        record.id === id ? { ...record, analysisApproved: true } : record,
      ),
    );
  }

  function deleteRecord(id: number) {
    if (!window.confirm(`Delete this ${config.recordNoun}?`)) {
      return;
    }

    const remainingRecords = records.filter((record) => record.id !== id);

    setRecords(remainingRecords);
    setAnalysisJsonByRecordId((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[id];
      return nextDrafts;
    });

    if (selectedRecordId === id) {
      setSelectedRecordId(remainingRecords[0]?.id ?? null);
    }
  }

  function resetDemoData() {
    if (
      !window.confirm(
        `Reset all ${config.recordPlural} back to the default sample data?`,
      )
    ) {
      return;
    }

    setRecords(config.initialRecords);
    setSelectedRecordId(config.initialRecords[0]?.id ?? null);
    setAnalysisJsonByRecordId({});
  }

  function buildPrompt(record: WorkflowRecord) {
    const fieldLines = config.fields
      .map((field) => {
        const value = getRecordValue(record, field.name);
        return `- ${field.label}: ${value || "Not provided"}`;
      })
      .join("\n");

    return `${config.promptRole}

${config.promptRules}

Return ONLY valid JSON. Do not include markdown. Do not include extra explanation.

Record:
${fieldLines}
- Current status: ${record.status}

Return JSON using this exact shape:
${JSON.stringify(config.jsonShape, null, 2)}`;
  }

  async function copyPrompt(record: WorkflowRecord) {
    await navigator.clipboard.writeText(buildPrompt(record));
    window.alert("Prompt copied. Paste it into ChatGPT or Claude.");
  }

  async function copySampleJson() {
    await navigator.clipboard.writeText(
      JSON.stringify(config.sampleAnalysis, null, 2),
    );
    window.alert(
      "Sample JSON copied. Paste it into the AI JSON result box.",
    );
  }

  async function copyOutput(record: WorkflowRecord) {
    if (!record.analysis || !config.output) {
      return;
    }

    await navigator.clipboard.writeText(
      stringifyOutput(record.analysis[config.output.field]),
    );
    window.alert("Output copied.");
  }

  async function saveCurrentRecordsToSupabase() {
    if (!storageReady) {
      setSupabaseSyncMessage({
        type: "error",
        text: `Local ${config.recordPlural} are still loading. Try again in a moment.`,
      });
      return;
    }

    if (records.length === 0) {
      setSupabaseSyncMessage({
        type: "error",
        text: `There are no ${config.recordPlural} to save to Supabase yet.`,
      });
      return;
    }

    const validRecords = records.filter(
      (record) => !getTitleSyncIssue(config, record),
    );
    const skippedCount = records.length - validRecords.length;

    if (validRecords.length === 0) {
      setSupabaseSyncMessage({
        type: "error",
        text: `Supabase save was not started. Add at least one ${config.recordNoun} with a display title of 3 or more characters.`,
      });
      return;
    }

    setIsSupabaseSyncing(true);
    setSupabaseSyncMessage(null);

    try {
      const response = await fetch(config.apiRoute, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: validRecords.map((record) =>
            mapRecordToDemoRecord(config, record),
          ),
        }),
      });
      const responseBody = (await response.json()) as unknown;

      if (!response.ok) {
        setSupabaseSyncMessage({
          type: "error",
          text: `${getApiErrorMessage(responseBody, "Supabase save failed.")} localStorage data was not changed.`,
        });
        return;
      }

      const savedCount =
        isObjectRecord(responseBody) && typeof responseBody.count === "number"
          ? responseBody.count
          : validRecords.length;
      const skippedText =
        skippedCount > 0
          ? ` Skipped ${skippedCount} invalid ${skippedCount === 1 ? config.recordNoun : config.recordPlural}.`
          : "";

      setSupabaseSyncMessage({
        type: "success",
        text: `Saved ${savedCount} ${savedCount === 1 ? config.recordNoun : config.recordPlural} to Supabase.${skippedText}`,
      });
    } catch (error) {
      setSupabaseSyncMessage({
        type: "error",
        text: `Supabase save failed: ${getSyncErrorMessage(error)}. localStorage data was not changed.`,
      });
    } finally {
      setIsSupabaseSyncing(false);
    }
  }

  async function loadRecordsFromSupabase() {
    if (!storageReady) {
      setSupabaseSyncMessage({
        type: "error",
        text: `Local ${config.recordPlural} are still loading. Try again in a moment.`,
      });
      return;
    }

    if (
      !window.confirm(
        `Load ${config.recordPlural} from Supabase? This will replace the current local demo state in this browser.`,
      )
    ) {
      return;
    }

    setIsSupabaseSyncing(true);
    setSupabaseSyncMessage(null);

    try {
      const response = await fetch(config.apiRoute);
      const responseBody = (await response.json()) as unknown;

      if (!response.ok) {
        setSupabaseSyncMessage({
          type: "error",
          text: `${getApiErrorMessage(responseBody, "Supabase load failed.")} Current localStorage data was not changed.`,
        });
        return;
      }

      if (!isObjectRecord(responseBody) || !Array.isArray(responseBody.records)) {
        setSupabaseSyncMessage({
          type: "error",
          text: "Supabase load failed: the API response did not include a records array. Current localStorage data was not changed.",
        });
        return;
      }

      const rows = responseBody.records as DemoRecordRow[];

      if (rows.length === 0) {
        setSupabaseSyncMessage({
          type: "success",
          text: `No ${config.recordPlural} were found in Supabase. Current local demo state was not changed.`,
        });
        return;
      }

      const usedIds = new Set<number>();
      const loadedRecords = rows.map((row, index) =>
        mapDemoRecordToWorkflowRecord(config, row, index, usedIds),
      );

      setRecords(loadedRecords);
      setSelectedRecordId(loadedRecords[0]?.id ?? null);
      setAnalysisJsonByRecordId({});
      setSupabaseSyncMessage({
        type: "success",
        text: `Loaded ${loadedRecords.length} ${loadedRecords.length === 1 ? config.recordNoun : config.recordPlural} from Supabase.`,
      });
    } catch (error) {
      setSupabaseSyncMessage({
        type: "error",
        text: `Supabase load failed: ${getSyncErrorMessage(error)}. Current localStorage data was not changed.`,
      });
    } finally {
      setIsSupabaseSyncing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow={config.eyebrow}
          title={config.title}
          description={config.description}
        />

        <div className="mt-10 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <DemoPanel>
            <h2 className="text-2xl font-semibold text-white">Intake</h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {config.fields.map((field) => (
                <div key={field.name}>
                  <label
                    className="text-sm font-medium text-slate-300"
                    htmlFor={field.name}
                  >
                    {field.label}
                  </label>
                  {renderFieldInput(field)}
                </div>
              ))}

              <button
                type="submit"
                className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {config.createButtonLabel}
              </button>
            </form>
          </DemoPanel>

          <DemoPanel>
            <DashboardHeader
              title="Dashboard"
              description="Track status, saved analysis, and human review."
              countLabel={`${records.length} ${records.length === 1 ? config.recordNoun : config.recordPlural}`}
              resetButtonLabel="Reset demo data"
              onReset={resetDemoData}
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {statusCounts.map((item) => (
                <MetricCard
                  key={item.status}
                  label={item.status}
                  value={item.count}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <MetricCard label="AI analyses saved" value={analyzedCount} />
              <MetricCard
                label="Human-reviewed analyses"
                value={reviewedCount}
              />
            </div>

            <div className="mt-6 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <p className="max-w-2xl text-xs leading-5 text-slate-400">
                  localStorage is the main demo workspace. Supabase sync is
                  optional database persistence.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={saveCurrentRecordsToSupabase}
                    disabled={isSupabaseSyncing}
                    className="rounded-full border border-cyan-400/60 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save to Supabase
                  </button>
                  <button
                    type="button"
                    onClick={loadRecordsFromSupabase}
                    disabled={isSupabaseSyncing}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Load from Supabase
                  </button>
                </div>
              </div>

              {supabaseSyncMessage ? (
                <p
                  className={`mt-4 rounded-xl border px-4 py-3 text-xs leading-5 ${
                    supabaseSyncMessage.type === "success"
                      ? "border-emerald-500/20 bg-slate-950/60 text-emerald-200"
                      : "border-amber-500/20 bg-slate-950/60 text-amber-200"
                  }`}
                >
                  {supabaseSyncMessage.text}
                </p>
              ) : null}
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="space-y-3">
                {records.length > 0 ? (
                  records.map((record) => (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => setSelectedRecordId(record.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedRecord?.id === record.id
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">
                          {getRecordTitle(config, record)}
                        </p>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                          {record.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-300">
                        {config.listMetaFields
                          .map((field) => getRecordValue(record, field))
                          .filter(Boolean)
                          .join(" / ") || config.recordNoun}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {getRecordValue(record, config.primaryTextField)}
                      </p>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title={`No ${config.recordPlural} yet.`}
                    description="Add a record to start."
                  />
                )}
              </div>

              {selectedRecord ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Selected record
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {getRecordTitle(config, selectedRecord)}
                  </h3>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {config.detailFields.map((field) => (
                      <div
                        key={field.field}
                        className="rounded-xl border border-slate-800 bg-slate-900/80 p-3"
                      >
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                          {field.label}
                        </p>
                        <p className="mt-2 text-sm text-slate-300">
                          {getRecordValue(selectedRecord, field.field) ||
                            "Not set"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteRecord(selectedRecord.id)}
                    className="mt-4 rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:bg-red-500/10"
                  >
                    Delete {config.recordNoun}
                  </button>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <p className="text-sm font-semibold text-slate-300">
                      Source text
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                      {getRecordValue(selectedRecord, config.primaryTextField) ||
                        "No source text provided."}
                    </p>
                  </div>

                  <StatusSelect
                    label="Status"
                    value={selectedRecord.status}
                    options={config.statuses}
                    onChange={(status) =>
                      updateRecordStatus(selectedRecord.id, status)
                    }
                  />

                  <div className="mt-5">
                    <label
                      className="text-sm font-medium text-slate-300"
                      htmlFor="selectedInternalNotes"
                    >
                      Internal notes
                    </label>
                    <textarea
                      id="selectedInternalNotes"
                      value={getRecordValue(
                        selectedRecord,
                        config.internalNotesField,
                      )}
                      onChange={(event) =>
                        updateInternalNotes(
                          selectedRecord.id,
                          event.target.value,
                        )
                      }
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-white">
                        Manual AI prompt
                      </p>
                      <button
                        type="button"
                        onClick={() => copyPrompt(selectedRecord)}
                        className="w-fit rounded-full border border-cyan-400/40 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                      >
                        Copy prompt
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={buildPrompt(selectedRecord)}
                      rows={10}
                      className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-300 outline-none"
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold text-white">
                        Paste AI JSON result
                      </p>
                      <button
                        type="button"
                        onClick={copySampleJson}
                        className="w-fit rounded-full border border-cyan-400/40 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                      >
                        Copy sample JSON
                      </button>
                    </div>
                    <textarea
                      value={analysisJsonByRecordId[selectedRecord.id] ?? ""}
                      onChange={(event) =>
                        setAnalysisJsonByRecordId((currentDrafts) => ({
                          ...currentDrafts,
                          [selectedRecord.id]: event.target.value,
                        }))
                      }
                      rows={8}
                      className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-400"
                      placeholder='{"summary":"..."}'
                    />
                    <button
                      type="button"
                      onClick={() =>
                        saveAnalysis(
                          selectedRecord.id,
                          analysisJsonByRecordId[selectedRecord.id] ?? "",
                        )
                      }
                      className="mt-3 rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Save AI analysis
                    </button>
                  </div>

                  {selectedRecord.analysis ? (
                    <AnalysisReviewCard
                      approved={selectedRecord.analysisApproved}
                      onApprove={() => approveAnalysis(selectedRecord.id)}
                    >
                      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                        {Object.entries(selectedRecord.analysis).map(
                          ([field, value]) => (
                            <div
                              key={field}
                              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
                            >
                              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                                {formatFieldLabel(field)}
                              </p>
                              <div className="mt-2">
                                {renderAnalysisValue(value)}
                              </div>
                            </div>
                          ),
                        )}
                      </div>

                      {config.output ? (
                        <div className="mt-4">
                          <CopyableOutputBox
                            title={config.output.title}
                            buttonLabel={config.output.buttonLabel}
                            onCopy={() => copyOutput(selectedRecord)}
                          >
                            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                              {stringifyOutput(
                                selectedRecord.analysis[config.output.field],
                              ) || "No output provided."}
                            </p>
                          </CopyableOutputBox>
                        </div>
                      ) : null}
                    </AnalysisReviewCard>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="No record selected."
                  description="Create or select a record to review."
                />
              )}
            </div>
          </DemoPanel>
        </div>
      </section>
    </main>
  );
}
