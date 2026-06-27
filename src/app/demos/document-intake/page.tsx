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

type DocumentStatus =
  | "New"
  | "Reviewing"
  | "Needs info"
  | "Approved"
  | "Archived";

type DocumentAnalysis = {
  summary: string;
  documentType: string;
  keyPoints: string[];
  missingInformation: string[];
  actionItems: string[];
  riskNote: string;
  nextAction: string;
};

type IntakeDocument = {
  id: number;
  title: string;
  type: string;
  source: string;
  receivedDate: string;
  content: string;
  internalNotes: string;
  status: DocumentStatus;
  analysis?: DocumentAnalysis;
  analysisApproved: boolean;
};

type SupabaseSyncMessage = {
  type: "success" | "error";
  text: string;
};

type DocumentDemoRecordRow = {
  id: string;
  title: string | null;
  status: string | null;
  source: string | null;
  raw_input: string | null;
  internal_notes: string | null;
  analysis: unknown;
  analysis_approved: boolean | null;
};

const statusOptions: DocumentStatus[] = [
  "New",
  "Reviewing",
  "Needs info",
  "Approved",
  "Archived",
];

const initialDocuments: IntakeDocument[] = [
  {
    id: 1,
    title: "Sample service request",
    type: "Client request",
    source: "Email copy",
    receivedDate: "",
    content:
      "Please update the monthly service plan for the North office beginning next month. The request mentions adding weekend support and sending the revised price for approval, but it does not include the expected weekend hours or the person authorized to approve the change.",
    internalNotes:
      "Sample document record. Confirm the missing schedule and approval contact before preparing an update.",
    status: "New",
    analysisApproved: false,
  },
];

const sampleDocumentAnalysis: DocumentAnalysis = {
  summary:
    "The document appears to describe a service request that needs review, missing details, and follow-up action before it can be finalized.",
  documentType: "Service request or intake note",
  keyPoints: [
    "The requester needs help with a specific service or process.",
    "Some important details are included, but the request is not fully complete.",
    "A human reviewer should verify the details before taking action.",
  ],
  missingInformation: [
    "Exact deadline or preferred timeline",
    "Budget or approval requirements",
    "Responsible contact person",
  ],
  actionItems: [
    "Ask the requester to confirm the missing details.",
    "Assign the document to the correct reviewer.",
    "Update the status after the reviewer confirms the next step.",
  ],
  riskNote:
    "The document text may be incomplete, so the AI summary should not be treated as final without human verification.",
  nextAction:
    "Contact the requester for missing information and assign the document for review.",
};

const STORAGE_KEY = "ai-workflow-systems-lab-documents";
const DOCUMENT_API_ROUTE = "/api/document-records";

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function getNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function isDocumentStatus(value: unknown): value is DocumentStatus {
  return (
    typeof value === "string" &&
    statusOptions.some((status) => status === value)
  );
}

function parseDocumentRawInput(
  rawInput: string | null,
): Record<string, unknown> {
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

function buildDocumentTitle(document: IntakeDocument) {
  return document.title.trim() || document.type.trim() || "Untitled document";
}

function getDocumentTitleSyncIssue(document: IntakeDocument) {
  const title = document.title.trim();

  if (!title) {
    return "Document titles must not be empty.";
  }

  if (title.toLowerCase() === "untitled document") {
    return "Placeholder document titles are skipped.";
  }

  if (title.length < 3) {
    return "Document titles must be at least 3 characters.";
  }

  return null;
}

function mapDocumentToDemoRecord(document: IntakeDocument) {
  return {
    title: buildDocumentTitle(document),
    status: document.status,
    source: document.source.trim() || document.type.trim() || null,
    raw_input: JSON.stringify({
      id: document.id,
      title: document.title,
      type: document.type,
      source: document.source,
      receivedDate: document.receivedDate,
      content: document.content,
      internalNotes: document.internalNotes,
      status: document.status,
    }),
    internal_notes: document.internalNotes,
    analysis: document.analysis ?? null,
    analysis_approved: document.analysisApproved,
  };
}

function buildFallbackDocumentId(index: number) {
  return Date.now() + index;
}

function mapDemoRecordToDocument(
  record: DocumentDemoRecordRow,
  index: number,
  usedIds: Set<number>,
): IntakeDocument {
  const rawDocument = parseDocumentRawInput(record.raw_input);
  const rawId = getNumber(rawDocument.id);
  let id = rawId ?? buildFallbackDocumentId(index);

  while (usedIds.has(id)) {
    id += 1;
  }

  usedIds.add(id);

  const analysis = isDocumentAnalysis(record.analysis)
    ? record.analysis
    : undefined;
  const status = isDocumentStatus(record.status)
    ? record.status
    : isDocumentStatus(rawDocument.status)
      ? rawDocument.status
      : "New";

  return {
    id,
    title:
      getString(rawDocument.title) ||
      record.title ||
      getString(rawDocument.type) ||
      "Supabase document",
    type:
      getString(rawDocument.type) ||
      record.source ||
      "Type not specified",
    source:
      getString(rawDocument.source) ||
      record.source ||
      "Supabase demo_records",
    receivedDate: getString(rawDocument.receivedDate) || "",
    content: getString(rawDocument.content) || "",
    internalNotes:
      record.internal_notes || getString(rawDocument.internalNotes) || "",
    status,
    analysis,
    analysisApproved: Boolean(record.analysis_approved && analysis),
  };
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

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "string")
  );
}

function isDocumentAnalysis(value: unknown): value is DocumentAnalysis {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    typeof value.summary === "string" &&
    typeof value.documentType === "string" &&
    isStringArray(value.keyPoints) &&
    isStringArray(value.missingInformation) &&
    isStringArray(value.actionItems) &&
    typeof value.riskNote === "string" &&
    typeof value.nextAction === "string"
  );
}

export default function DocumentIntakePage() {
  const [documents, setDocuments] =
    useState<IntakeDocument[]>(initialDocuments);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(
    initialDocuments[0].id,
  );
  const [analysisJsonByDocumentId, setAnalysisJsonByDocumentId] = useState<
    Record<number, string>
  >({});
  const [storageReady, setStorageReady] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] =
    useState<SupabaseSyncMessage | null>(null);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);

  useEffect(() => {
    const savedDocuments = window.localStorage.getItem(STORAGE_KEY);
    let animationFrameId: number | undefined;

    if (savedDocuments) {
      try {
        const parsedDocuments = JSON.parse(savedDocuments) as unknown;

        if (!Array.isArray(parsedDocuments)) {
          throw new Error("Saved document data is not an array.");
        }

        const savedDocumentRecords = (
          parsedDocuments as IntakeDocument[]
        ).map((document) => ({
          ...document,
          receivedDate: document.receivedDate ?? "",
          analysisApproved: document.analysisApproved ?? false,
        }));

        animationFrameId = window.requestAnimationFrame(() => {
          setDocuments(savedDocumentRecords);
          setSelectedDocumentId(savedDocumentRecords[0]?.id ?? null);
          setStorageReady(true);
        });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
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
  }, []);

  useEffect(() => {
    if (!storageReady) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(documents));
  }, [documents, storageReady]);

  const selectedDocument =
    documents.find((document) => document.id === selectedDocumentId) ??
    documents[0];
  const statusCounts = statusOptions.map((status) => ({
    status,
    count: documents.filter((document) => document.status === status).length,
  }));
  const analyzedCount = documents.filter(
    (document) => document.analysis,
  ).length;
  const reviewedCount = documents.filter(
    (document) => document.analysisApproved,
  ).length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newDocument: IntakeDocument = {
      id: Date.now(),
      title: String(formData.get("title") || "Untitled document"),
      type: String(formData.get("type") || "Type not specified"),
      source: String(formData.get("source") || "Unknown source"),
      receivedDate: String(formData.get("receivedDate") || ""),
      content: String(formData.get("content") || ""),
      internalNotes: String(formData.get("internalNotes") || ""),
      status: "New",
      analysisApproved: false,
    };

    setDocuments((currentDocuments) => [
      newDocument,
      ...currentDocuments,
    ]);
    setSelectedDocumentId(newDocument.id);
    event.currentTarget.reset();
  }

  function updateDocumentStatus(id: number, status: DocumentStatus) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === id ? { ...document, status } : document,
      ),
    );
  }

  function updateInternalNotes(id: number, internalNotes: string) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === id ? { ...document, internalNotes } : document,
      ),
    );
  }

  function saveDocumentAnalysis(id: number, rawJson: string) {
    let parsedAnalysis: unknown;

    try {
      parsedAnalysis = JSON.parse(rawJson);
    } catch {
      window.alert("The pasted AI output is not valid JSON. Try again.");
      return;
    }

    if (!isDocumentAnalysis(parsedAnalysis)) {
      window.alert("The pasted AI output is not valid JSON. Try again.");
      return;
    }

    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === id
          ? {
              ...document,
              analysis: parsedAnalysis,
              analysisApproved: false,
            }
          : document,
      ),
    );
  }

  function approveDocumentAnalysis(id: number) {
    setDocuments((currentDocuments) =>
      currentDocuments.map((document) =>
        document.id === id
          ? { ...document, analysisApproved: true }
          : document,
      ),
    );
  }

  function deleteDocument(id: number) {
    if (!window.confirm("Delete this document?")) {
      return;
    }

    const remainingDocuments = documents.filter(
      (document) => document.id !== id,
    );

    setDocuments(remainingDocuments);
    setAnalysisJsonByDocumentId((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[id];
      return nextDrafts;
    });

    if (selectedDocumentId === id) {
      setSelectedDocumentId(remainingDocuments[0]?.id ?? null);
    }
  }

  function resetDemoData() {
    if (
      !window.confirm(
        "Reset all demo documents back to the default sample data?",
      )
    ) {
      return;
    }

    setDocuments(initialDocuments);
    setSelectedDocumentId(initialDocuments[0].id);
    setAnalysisJsonByDocumentId({});
  }

  function buildDocumentAnalysisPrompt(document: IntakeDocument) {
    return `You are helping organize a document for human review.

Use only the provided text. Do not invent facts or assume missing details. Clearly identify uncertainty, missing information, and anything that requires verification.

Return ONLY valid JSON. Do not include markdown. Do not include extra explanation.

Document record:
- Title: ${document.title}
- Submitted document type: ${document.type}
- Source: ${document.source}
- Document received date: ${document.receivedDate || "Not set"}
- Current status: ${document.status}
- Internal notes: ${document.internalNotes || "None"}
- Document text / pasted content: ${document.content || "No document text provided"}

Return JSON using this exact shape:
{
  "summary": "short plain-English summary of the document",
  "documentType": "likely document category",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "missingInformation": ["missing info 1", "missing info 2"],
  "actionItems": ["action item 1", "action item 2"],
  "riskNote": "uncertainties, risks, or things requiring human verification",
  "nextAction": "recommended next practical step"
}`;
  }

  async function copyDocumentPrompt(document: IntakeDocument) {
    await navigator.clipboard.writeText(
      buildDocumentAnalysisPrompt(document),
    );
    window.alert("Prompt copied. Paste it into ChatGPT or Claude.");
  }

  async function copySampleJson() {
    await navigator.clipboard.writeText(
      JSON.stringify(sampleDocumentAnalysis, null, 2),
    );
    window.alert(
      "Sample JSON copied. Paste it into the AI JSON result box.",
    );
  }

  async function copyActionItems(document: IntakeDocument) {
    if (!document.analysis) {
      return;
    }

    await navigator.clipboard.writeText(document.analysis.actionItems.join("\n"));
    window.alert("Action items copied.");
  }

  async function saveCurrentDocumentsToSupabase() {
    if (!storageReady) {
      setSupabaseSyncMessage({
        type: "error",
        text: "Local document data is still loading. Try again in a moment.",
      });
      return;
    }

    if (documents.length === 0) {
      setSupabaseSyncMessage({
        type: "error",
        text: "There are no documents to save to Supabase yet.",
      });
      return;
    }

    const validDocuments = documents.filter(
      (document) => !getDocumentTitleSyncIssue(document),
    );
    const skippedCount = documents.length - validDocuments.length;

    if (validDocuments.length === 0) {
      setSupabaseSyncMessage({
        type: "error",
        text: "Supabase save was not started. Add at least one document with a title of 3 or more characters.",
      });
      return;
    }

    setIsSupabaseSyncing(true);
    setSupabaseSyncMessage(null);

    try {
      const response = await fetch(DOCUMENT_API_ROUTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: validDocuments.map(mapDocumentToDemoRecord),
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
          : validDocuments.length;
      const skippedText =
        skippedCount > 0
          ? ` Skipped ${skippedCount} document${skippedCount === 1 ? "" : "s"} with missing or invalid titles.`
          : "";

      setSupabaseSyncMessage({
        type: "success",
        text: `Saved ${savedCount} document${savedCount === 1 ? "" : "s"} to Supabase through the internal API route.${skippedText} Your local browser workspace remains active.`,
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

  async function loadDocumentsFromSupabase() {
    if (!storageReady) {
      setSupabaseSyncMessage({
        type: "error",
        text: "Local document data is still loading. Try again in a moment.",
      });
      return;
    }

    if (
      !window.confirm(
        "Load documents from Supabase? This will replace the current local demo state in this browser.",
      )
    ) {
      return;
    }

    setIsSupabaseSyncing(true);
    setSupabaseSyncMessage(null);

    try {
      const response = await fetch(DOCUMENT_API_ROUTE);
      const responseBody = (await response.json()) as unknown;

      if (!response.ok) {
        setSupabaseSyncMessage({
          type: "error",
          text: `${getApiErrorMessage(responseBody, "Supabase load failed.")} Current localStorage documents were not changed.`,
        });
        return;
      }

      if (!isObjectRecord(responseBody) || !Array.isArray(responseBody.records)) {
        setSupabaseSyncMessage({
          type: "error",
          text: "Supabase load failed: the API response did not include a records array. Current localStorage documents were not changed.",
        });
        return;
      }

      const records = responseBody.records as DocumentDemoRecordRow[];

      if (records.length === 0) {
        setSupabaseSyncMessage({
          type: "success",
          text: "No document records were found in Supabase. Current local demo state was not changed.",
        });
        return;
      }

      const usedIds = new Set<number>();
      const loadedDocuments = records.map((record, index) =>
        mapDemoRecordToDocument(record, index, usedIds),
      );

      setDocuments(loadedDocuments);
      setSelectedDocumentId(loadedDocuments[0]?.id ?? null);
      setAnalysisJsonByDocumentId({});
      setSupabaseSyncMessage({
        type: "success",
        text: `Loaded ${loadedDocuments.length} document${loadedDocuments.length === 1 ? "" : "s"} from Supabase. This replaced the current local demo state and will continue saving to localStorage.`,
      });
    } catch (error) {
      setSupabaseSyncMessage({
        type: "error",
        text: `Supabase load failed: ${getSyncErrorMessage(error)}. Current localStorage documents were not changed.`,
      });
    } finally {
      setIsSupabaseSyncing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Demo 03"
          title="Document Intake Assistant"
          description="A manual-AI workflow demo for turning messy document text into structured summaries, action items, missing information, and human-reviewed next steps."
        />

        <div className="mt-10 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DemoPanel>
            <h2 className="text-2xl font-semibold text-white">
              Document intake
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Capture pasted document text and review context in one record.
              Demo data persists in this browser with localStorage.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="title"
                >
                  Document title
                </label>
                <input
                  id="title"
                  name="title"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Example: April service request"
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="type"
                >
                  Document type
                </label>
                <input
                  id="type"
                  name="type"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Request, policy, meeting notes, contract..."
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="source"
                >
                  Source
                </label>
                <input
                  id="source"
                  name="source"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Email, shared drive, form, copied notes..."
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="receivedDate"
                >
                  Document received date
                </label>
                <input
                  id="receivedDate"
                  name="receivedDate"
                  type="date"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="content"
                >
                  Document text / pasted content
                </label>
                <textarea
                  id="content"
                  name="content"
                  required
                  rows={8}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Paste the document text here..."
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="internalNotes"
                >
                  Internal notes
                </label>
                <textarea
                  id="internalNotes"
                  name="internalNotes"
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Review context, questions, or handling notes..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Create document record
              </button>
            </form>
          </DemoPanel>

          <DemoPanel>
            <DashboardHeader
              title="Document dashboard"
              description="Track review status, saved AI analysis, and human approval."
              countLabel={`${documents.length} document${documents.length === 1 ? "" : "s"}`}
              resetButtonLabel="Reset demo data"
              onReset={resetDemoData}
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-5">
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
                <div>
                  <p className="text-sm font-semibold text-cyan-200">
                    Optional Supabase sync
                  </p>
                  <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                    localStorage is the main demo workspace in this browser.
                    Supabase sync is optional database persistence for testing
                    the backend path.
                  </p>
                  <ul className="mt-3 space-y-1 text-xs leading-5 text-slate-400">
                    <li>
                      Save sends current local documents to the database
                      through the internal API route.
                    </li>
                    <li>
                      Load replaces the current local demo state with database
                      records after confirmation.
                    </li>
                  </ul>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={saveCurrentDocumentsToSupabase}
                    disabled={isSupabaseSyncing}
                    className="rounded-full border border-cyan-400/60 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save current documents to Supabase
                  </button>
                  <button
                    type="button"
                    onClick={loadDocumentsFromSupabase}
                    disabled={isSupabaseSyncing}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Load documents from Supabase
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

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                {documents.length > 0 ? (
                  documents.map((document) => (
                    <button
                      key={document.id}
                      type="button"
                      onClick={() => setSelectedDocumentId(document.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedDocument?.id === document.id
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">
                          {document.title}
                        </p>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                          {document.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-300">
                        {document.type}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {document.source}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {document.content}
                      </p>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="No documents yet."
                    description="Add pasted content to start."
                  />
                )}
              </div>

              {selectedDocument ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Selected document
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {selectedDocument.title}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-300">
                    {selectedDocument.type}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedDocument.source}
                  </p>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-300">
                      Document received date
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {selectedDocument.receivedDate ||
                        "No received date set."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteDocument(selectedDocument.id)}
                    className="mt-4 rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:bg-red-500/10"
                  >
                    Delete document
                  </button>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <p className="text-sm font-semibold text-slate-300">
                      Document text / pasted content
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                      {selectedDocument.content ||
                        "No document text provided."}
                    </p>
                  </div>

                  <StatusSelect
                    label="Status"
                    value={selectedDocument.status}
                    options={statusOptions}
                    onChange={(status) =>
                      updateDocumentStatus(selectedDocument.id, status)
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
                      rows={5}
                      value={selectedDocument.internalNotes}
                      onChange={(event) =>
                        updateInternalNotes(
                          selectedDocument.id,
                          event.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-cyan-200">
                          Manual AI document prompt
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Copy this structured prompt into ChatGPT or Claude,
                          then paste the JSON output below.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyDocumentPrompt(selectedDocument)
                        }
                        className="w-fit rounded-full border border-cyan-400 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
                      >
                        Copy AI prompt
                      </button>
                    </div>

                    <textarea
                      readOnly
                      value={buildDocumentAnalysisPrompt(selectedDocument)}
                      rows={16}
                      className="mt-4 w-full rounded-xl border border-cyan-500/20 bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-300 outline-none"
                    />

                    <div className="mt-5">
                      <label
                        className="text-sm font-medium text-cyan-100"
                        htmlFor="documentAnalysisJson"
                      >
                        Paste AI JSON result
                      </label>
                      <textarea
                        id="documentAnalysisJson"
                        value={
                          analysisJsonByDocumentId[selectedDocument.id] ?? ""
                        }
                        onChange={(event) =>
                          setAnalysisJsonByDocumentId((currentDrafts) => ({
                            ...currentDrafts,
                            [selectedDocument.id]: event.target.value,
                          }))
                        }
                        rows={11}
                        className="mt-2 w-full rounded-xl border border-cyan-500/20 bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-300 outline-none transition focus:border-cyan-400"
                        placeholder='Paste the AI JSON here, starting with {"summary": ...}'
                      />
                      <p className="mt-3 text-xs leading-5 text-slate-400">
                        Testing the demo? Copy sample JSON, paste it below, then
                        save the analysis.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={copySampleJson}
                          className="rounded-full border border-cyan-400/40 px-5 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                        >
                          Copy sample JSON
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            saveDocumentAnalysis(
                              selectedDocument.id,
                              analysisJsonByDocumentId[selectedDocument.id] ??
                                "",
                            )
                          }
                          className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                          Save AI analysis
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedDocument.analysis ? (
                    <AnalysisReviewCard
                      approved={selectedDocument.analysisApproved}
                      onApprove={() =>
                        approveDocumentAnalysis(selectedDocument.id)
                      }
                    >
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Summary
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedDocument.analysis.summary}
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Likely document type
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-300">
                              {selectedDocument.analysis.documentType}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Next action
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-300">
                              {selectedDocument.analysis.nextAction}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Key points
                          </p>
                          <ul className="mt-2 space-y-2">
                            {selectedDocument.analysis.keyPoints.map(
                              (point, index) => (
                                <li
                                  key={`${point}-${index}`}
                                  className="text-sm leading-6 text-slate-300"
                                >
                                  {index + 1}. {point}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Missing information
                          </p>
                          <ul className="mt-2 space-y-2">
                            {selectedDocument.analysis.missingInformation.map(
                              (item, index) => (
                                <li
                                  key={`${item}-${index}`}
                                  className="text-sm leading-6 text-slate-300"
                                >
                                  {index + 1}. {item}
                                </li>
                              ),
                            )}
                          </ul>
                        </div>

                        <CopyableOutputBox
                          title="Action items"
                          buttonLabel="Copy action items"
                          onCopy={() => copyActionItems(selectedDocument)}
                        >
                          <ol className="mt-3 space-y-2">
                            {selectedDocument.analysis.actionItems.map(
                              (item, index) => (
                                <li
                                  key={`${item}-${index}`}
                                  className="text-sm leading-6 text-slate-300"
                                >
                                  {index + 1}. {item}
                                </li>
                              ),
                            )}
                          </ol>
                        </CopyableOutputBox>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Risk note
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedDocument.analysis.riskNote}
                          </p>
                        </div>
                      </div>
                    </AnalysisReviewCard>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="No documents yet."
                  description="Add pasted content to start."
                />
              )}
            </div>
          </DemoPanel>
        </div>
      </section>
    </main>
  );
}
