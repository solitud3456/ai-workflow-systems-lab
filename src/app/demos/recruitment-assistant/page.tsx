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

type CandidateStatus =
  | "New"
  | "Screening"
  | "Interview"
  | "Offer"
  | "Rejected";

type CandidateAnalysis = {
  summary: string;
  fitScore: "low" | "medium" | "high";
  strengths: string;
  concerns: string;
  suggestedInterviewQuestions: string[];
  nextAction: string;
  riskNote: string;
};

type Candidate = {
  id: number;
  name: string;
  role: string;
  source: string;
  applicationDate: string;
  applicationText: string;
  recruiterNotes: string;
  status: CandidateStatus;
  analysis?: CandidateAnalysis;
  analysisApproved: boolean;
};

type SupabaseSyncMessage = {
  type: "success" | "error";
  text: string;
};

type CandidateDemoRecordRow = {
  id: string;
  title: string | null;
  status: string | null;
  source: string | null;
  raw_input: string | null;
  internal_notes: string | null;
  analysis: unknown;
  analysis_approved: boolean | null;
};

const statusOptions: CandidateStatus[] = [
  "New",
  "Screening",
  "Interview",
  "Offer",
  "Rejected",
];

const initialCandidates: Candidate[] = [
  {
    id: 1,
    name: "Jordan Lee",
    role: "Operations Coordinator",
    source: "Careers page",
    applicationDate: "",
    applicationText:
      "Three years supporting scheduling, customer requests, and weekly reporting for a small logistics team. Comfortable with spreadsheets and coordinating across departments. Interested in moving into a role with more process ownership.",
    recruiterNotes:
      "Sample candidate record. Confirm experience improving a process and handling competing priorities.",
    status: "New",
    analysisApproved: false,
  },
];

const sampleCandidateAnalysis: CandidateAnalysis = {
  summary:
    "The candidate has relevant customer service experience and appears suitable for an initial screening conversation.",
  fitScore: "medium",
  strengths:
    "The candidate has prior communication experience, seems motivated, and may fit a client-facing role.",
  concerns:
    "The application does not clearly show technical skills, salary expectations, or long-term availability.",
  suggestedInterviewQuestions: [
    "Can you describe a time you handled a difficult customer or client?",
    "What interests you about this role and this company?",
    "What is your expected salary range and earliest available start date?",
  ],
  nextAction:
    "Schedule a short screening interview and clarify availability, salary expectations, and role-specific skills.",
  riskNote:
    "The notes are incomplete, so the evaluation should not be treated as a final hiring decision.",
};

const STORAGE_KEY = "ai-workflow-systems-lab-candidates";
const RECRUITMENT_API_ROUTE = "/api/recruitment-records";

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

function isCandidateStatus(value: unknown): value is CandidateStatus {
  return (
    typeof value === "string" &&
    statusOptions.some((status) => status === value)
  );
}

function parseCandidateRawInput(
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

function buildCandidateTitle(candidate: Candidate) {
  return candidate.name.trim() || candidate.role.trim() || "Untitled candidate";
}

function getCandidateNameSyncIssue(candidate: Candidate) {
  const name = candidate.name.trim();

  if (!name) {
    return "Candidate names must not be empty.";
  }

  if (name.toLowerCase() === "untitled candidate") {
    return "Placeholder candidate names are skipped.";
  }

  if (name.length < 3) {
    return "Candidate names must be at least 3 characters.";
  }

  return null;
}

function mapCandidateToDemoRecord(candidate: Candidate) {
  return {
    title: buildCandidateTitle(candidate),
    status: candidate.status,
    source: candidate.source.trim() || candidate.role.trim() || null,
    raw_input: JSON.stringify({
      id: candidate.id,
      name: candidate.name,
      role: candidate.role,
      source: candidate.source,
      applicationDate: candidate.applicationDate,
      applicationText: candidate.applicationText,
      recruiterNotes: candidate.recruiterNotes,
      status: candidate.status,
    }),
    internal_notes: candidate.recruiterNotes,
    analysis: candidate.analysis ?? null,
    analysis_approved: candidate.analysisApproved,
  };
}

function buildFallbackCandidateId(index: number) {
  return Date.now() + index;
}

function mapDemoRecordToCandidate(
  record: CandidateDemoRecordRow,
  index: number,
  usedIds: Set<number>,
): Candidate {
  const rawCandidate = parseCandidateRawInput(record.raw_input);
  const rawId = getNumber(rawCandidate.id);
  let id = rawId ?? buildFallbackCandidateId(index);

  while (usedIds.has(id)) {
    id += 1;
  }

  usedIds.add(id);

  const analysis = isCandidateAnalysis(record.analysis)
    ? record.analysis
    : undefined;
  const status = isCandidateStatus(record.status)
    ? record.status
    : isCandidateStatus(rawCandidate.status)
      ? rawCandidate.status
      : "New";

  return {
    id,
    name:
      getString(rawCandidate.name) ||
      record.title ||
      getString(rawCandidate.role) ||
      "Supabase candidate",
    role:
      getString(rawCandidate.role) ||
      record.source ||
      "Role not specified",
    source:
      getString(rawCandidate.source) ||
      record.source ||
      "Supabase demo_records",
    applicationDate: getString(rawCandidate.applicationDate) || "",
    applicationText: getString(rawCandidate.applicationText) || "",
    recruiterNotes:
      record.internal_notes || getString(rawCandidate.recruiterNotes) || "",
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

function isCandidateAnalysis(value: unknown): value is CandidateAnalysis {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    typeof value.summary === "string" &&
    (value.fitScore === "low" ||
      value.fitScore === "medium" ||
      value.fitScore === "high") &&
    typeof value.strengths === "string" &&
    typeof value.concerns === "string" &&
    Array.isArray(value.suggestedInterviewQuestions) &&
    value.suggestedInterviewQuestions.every(
      (question) => typeof question === "string",
    ) &&
    typeof value.nextAction === "string" &&
    typeof value.riskNote === "string"
  );
}

export default function RecruitmentAssistantPage() {
  const [candidates, setCandidates] =
    useState<Candidate[]>(initialCandidates);
  const [selectedCandidateId, setSelectedCandidateId] = useState<
    number | null
  >(initialCandidates[0].id);
  const [analysisJsonByCandidateId, setAnalysisJsonByCandidateId] = useState<
    Record<number, string>
  >({});
  const [storageReady, setStorageReady] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] =
    useState<SupabaseSyncMessage | null>(null);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);

  useEffect(() => {
    const savedCandidates = window.localStorage.getItem(STORAGE_KEY);
    let animationFrameId: number | undefined;

    if (savedCandidates) {
      try {
        const parsedCandidates = JSON.parse(savedCandidates) as Candidate[];
        const savedCandidateRecords = parsedCandidates.map((candidate) => ({
          ...candidate,
          applicationDate: candidate.applicationDate ?? "",
          analysisApproved: candidate.analysisApproved ?? false,
        }));

        animationFrameId = window.requestAnimationFrame(() => {
          setCandidates(savedCandidateRecords);
          setSelectedCandidateId(savedCandidateRecords[0]?.id ?? null);
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

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(candidates));
  }, [candidates, storageReady]);

  const selectedCandidate =
    candidates.find((candidate) => candidate.id === selectedCandidateId) ??
    candidates[0];
  const statusCounts = statusOptions.map((status) => ({
    status,
    count: candidates.filter((candidate) => candidate.status === status).length,
  }));
  const analyzedCount = candidates.filter(
    (candidate) => candidate.analysis,
  ).length;
  const reviewedCount = candidates.filter(
    (candidate) => candidate.analysisApproved,
  ).length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const newCandidate: Candidate = {
      id: Date.now(),
      name: String(formData.get("name") || "Untitled candidate"),
      role: String(formData.get("role") || "Role not specified"),
      source: String(formData.get("source") || "Unknown source"),
      applicationDate: String(formData.get("applicationDate") || ""),
      applicationText: String(formData.get("applicationText") || ""),
      recruiterNotes: String(formData.get("recruiterNotes") || ""),
      status: "New",
      analysisApproved: false,
    };

    setCandidates((currentCandidates) => [
      newCandidate,
      ...currentCandidates,
    ]);
    setSelectedCandidateId(newCandidate.id);
    event.currentTarget.reset();
  }

  function updateCandidateStatus(id: number, status: CandidateStatus) {
    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === id ? { ...candidate, status } : candidate,
      ),
    );
  }

  function updateRecruiterNotes(id: number, recruiterNotes: string) {
    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === id ? { ...candidate, recruiterNotes } : candidate,
      ),
    );
  }

  function saveCandidateAnalysis(id: number, rawJson: string) {
    let parsedAnalysis: unknown;

    try {
      parsedAnalysis = JSON.parse(rawJson);
    } catch {
      window.alert("The pasted AI output is not valid JSON. Try again.");
      return;
    }

    if (!isCandidateAnalysis(parsedAnalysis)) {
      window.alert("The pasted AI output is not valid JSON. Try again.");
      return;
    }

    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === id
          ? {
              ...candidate,
              analysis: parsedAnalysis,
              analysisApproved: false,
            }
          : candidate,
      ),
    );
  }

  function approveCandidateAnalysis(id: number) {
    setCandidates((currentCandidates) =>
      currentCandidates.map((candidate) =>
        candidate.id === id
          ? { ...candidate, analysisApproved: true }
          : candidate,
      ),
    );
  }

  function deleteCandidate(id: number) {
    if (!window.confirm("Delete this candidate?")) {
      return;
    }

    const remainingCandidates = candidates.filter(
      (candidate) => candidate.id !== id,
    );

    setCandidates(remainingCandidates);
    setAnalysisJsonByCandidateId((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[id];
      return nextDrafts;
    });

    if (selectedCandidateId === id) {
      setSelectedCandidateId(remainingCandidates[0]?.id ?? null);
    }
  }

  function resetDemoData() {
    if (
      !window.confirm(
        "Reset all demo candidates back to the default sample data?",
      )
    ) {
      return;
    }

    setCandidates(initialCandidates);
    setSelectedCandidateId(initialCandidates[0].id);
    setAnalysisJsonByCandidateId({});
  }

  function buildCandidateAnalysisPrompt(candidate: Candidate) {
    return `You are helping a recruiter organize candidate information before a human screening decision.

Use only the information provided. Do not infer protected characteristics or invent experience. Treat fitScore as a preliminary workflow signal, not a hiring decision. Put uncertainty, possible bias, and missing evidence in riskNote.

Return ONLY valid JSON. Do not include markdown. Do not include extra explanation.

Candidate record:
- Candidate name: ${candidate.name}
- Role applied for: ${candidate.role}
- Source: ${candidate.source}
- Application date: ${candidate.applicationDate || "Not set"}
- Current status: ${candidate.status}
- Internal recruiter notes: ${candidate.recruiterNotes || "None"}
- Candidate notes / application text: ${candidate.applicationText || "No application text provided"}

Return JSON using this exact shape:
{
  "summary": "short candidate summary",
  "fitScore": "low | medium | high",
  "strengths": "main strengths",
  "concerns": "main concerns or missing info",
  "suggestedInterviewQuestions": ["question 1", "question 2", "question 3"],
  "nextAction": "recommended recruiter next step",
  "riskNote": "uncertainties, bias risks, or missing information"
}`;
  }

  async function copyCandidatePrompt(candidate: Candidate) {
    await navigator.clipboard.writeText(
      buildCandidateAnalysisPrompt(candidate),
    );
    window.alert("Prompt copied. Paste it into ChatGPT or Claude.");
  }

  async function copySampleJson() {
    await navigator.clipboard.writeText(
      JSON.stringify(sampleCandidateAnalysis, null, 2),
    );
    window.alert(
      "Sample JSON copied. Paste it into the AI JSON result box.",
    );
  }

  async function copyInterviewQuestions(candidate: Candidate) {
    if (!candidate.analysis) {
      return;
    }

    await navigator.clipboard.writeText(
      candidate.analysis.suggestedInterviewQuestions.join("\n"),
    );
    window.alert("Interview questions copied.");
  }

  async function saveCurrentCandidatesToSupabase() {
    if (!storageReady) {
      setSupabaseSyncMessage({
        type: "error",
        text: "Local candidate data is still loading. Try again in a moment.",
      });
      return;
    }

    if (candidates.length === 0) {
      setSupabaseSyncMessage({
        type: "error",
        text: "There are no candidates to save to Supabase yet.",
      });
      return;
    }

    const validCandidates = candidates.filter(
      (candidate) => !getCandidateNameSyncIssue(candidate),
    );
    const skippedCount = candidates.length - validCandidates.length;

    if (validCandidates.length === 0) {
      setSupabaseSyncMessage({
        type: "error",
        text: "Supabase save was not started. Add at least one candidate with a name of 3 or more characters.",
      });
      return;
    }

    setIsSupabaseSyncing(true);
    setSupabaseSyncMessage(null);

    try {
      const response = await fetch(RECRUITMENT_API_ROUTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: validCandidates.map(mapCandidateToDemoRecord),
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
          : validCandidates.length;
      const skippedText =
        skippedCount > 0
          ? ` Skipped ${skippedCount} candidate${skippedCount === 1 ? "" : "s"} with missing or invalid names.`
          : "";

      setSupabaseSyncMessage({
        type: "success",
        text: `Saved ${savedCount} candidate${savedCount === 1 ? "" : "s"} to Supabase through the internal API route.${skippedText} Your local browser workspace remains active.`,
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

  async function loadCandidatesFromSupabase() {
    if (!storageReady) {
      setSupabaseSyncMessage({
        type: "error",
        text: "Local candidate data is still loading. Try again in a moment.",
      });
      return;
    }

    if (
      !window.confirm(
        "Load candidates from Supabase? This will replace the current local demo state in this browser.",
      )
    ) {
      return;
    }

    setIsSupabaseSyncing(true);
    setSupabaseSyncMessage(null);

    try {
      const response = await fetch(RECRUITMENT_API_ROUTE);
      const responseBody = (await response.json()) as unknown;

      if (!response.ok) {
        setSupabaseSyncMessage({
          type: "error",
          text: `${getApiErrorMessage(responseBody, "Supabase load failed.")} Current localStorage candidates were not changed.`,
        });
        return;
      }

      if (!isObjectRecord(responseBody) || !Array.isArray(responseBody.records)) {
        setSupabaseSyncMessage({
          type: "error",
          text: "Supabase load failed: the API response did not include a records array. Current localStorage candidates were not changed.",
        });
        return;
      }

      const records = responseBody.records as CandidateDemoRecordRow[];

      if (records.length === 0) {
        setSupabaseSyncMessage({
          type: "success",
          text: "No candidate records were found in Supabase. Current local demo state was not changed.",
        });
        return;
      }

      const usedIds = new Set<number>();
      const loadedCandidates = records.map((record, index) =>
        mapDemoRecordToCandidate(record, index, usedIds),
      );

      setCandidates(loadedCandidates);
      setSelectedCandidateId(loadedCandidates[0]?.id ?? null);
      setAnalysisJsonByCandidateId({});
      setSupabaseSyncMessage({
        type: "success",
        text: `Loaded ${loadedCandidates.length} candidate${loadedCandidates.length === 1 ? "" : "s"} from Supabase. This replaced the current local demo state and will continue saving to localStorage.`,
      });
    } catch (error) {
      setSupabaseSyncMessage({
        type: "error",
        text: `Supabase load failed: ${getSyncErrorMessage(error)}. Current localStorage candidates were not changed.`,
      });
    } finally {
      setIsSupabaseSyncing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Demo 02"
          title="Recruitment Workflow Assistant"
          description="A manual-AI workflow demo for turning messy candidate notes into structured screening summaries, interview questions, and human-reviewed next steps."
        />

        <div className="mt-10 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DemoPanel>
            <h2 className="text-2xl font-semibold text-white">
              Candidate intake
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Capture application details and recruiter context in one record.
              Candidate data persists in this browser for the demo.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="name"
                >
                  Candidate name
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Example: Jordan Lee"
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="role"
                >
                  Role applied for
                </label>
                <input
                  id="role"
                  name="role"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Example: Operations Coordinator"
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
                  placeholder="Careers page, referral, LinkedIn..."
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="applicationDate"
                >
                  Application date
                </label>
                <input
                  id="applicationDate"
                  name="applicationDate"
                  type="date"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="applicationText"
                >
                  Candidate notes / application text
                </label>
                <textarea
                  id="applicationText"
                  name="applicationText"
                  required
                  rows={6}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Paste resume highlights, application answers, or screening notes..."
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="recruiterNotes"
                >
                  Internal recruiter notes
                </label>
                <textarea
                  id="recruiterNotes"
                  name="recruiterNotes"
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Questions to verify, scheduling context, or team notes..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Create candidate record
              </button>
            </form>
          </DemoPanel>

          <DemoPanel>
            <DashboardHeader
              title="Candidate dashboard"
              description="Track each candidate from intake through a human-reviewed next step."
              countLabel={`${candidates.length} candidate${candidates.length === 1 ? "" : "s"}`}
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
                      Save sends current local candidates to the database
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
                    onClick={saveCurrentCandidatesToSupabase}
                    disabled={isSupabaseSyncing}
                    className="rounded-full border border-cyan-400/60 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save current candidates to Supabase
                  </button>
                  <button
                    type="button"
                    onClick={loadCandidatesFromSupabase}
                    disabled={isSupabaseSyncing}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Load candidates from Supabase
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
                {candidates.length > 0 ? (
                  candidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => setSelectedCandidateId(candidate.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedCandidate?.id === candidate.id
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">
                          {candidate.name}
                        </p>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                          {candidate.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-300">
                        {candidate.role}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {candidate.source}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {candidate.applicationText}
                      </p>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="No candidates yet."
                    description="Add an application to start."
                  />
                )}
              </div>

              {selectedCandidate ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Selected candidate
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {selectedCandidate.name}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-slate-300">
                    {selectedCandidate.role}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {selectedCandidate.source}
                  </p>
                  <div className="mt-4">
                    <p className="text-sm font-medium text-slate-300">
                      Application date
                    </p>
                    <p className="mt-2 text-sm text-slate-400">
                      {selectedCandidate.applicationDate ||
                        "No application date set."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteCandidate(selectedCandidate.id)}
                    className="mt-4 rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:bg-red-500/10"
                  >
                    Delete candidate
                  </button>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <p className="text-sm font-semibold text-slate-300">
                      Candidate notes / application text
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                      {selectedCandidate.applicationText ||
                        "No application text provided."}
                    </p>
                  </div>

                  <StatusSelect
                    label="Status"
                    value={selectedCandidate.status}
                    options={statusOptions}
                    onChange={(status) =>
                      updateCandidateStatus(selectedCandidate.id, status)
                    }
                  />

                  <div className="mt-5">
                    <label
                      className="text-sm font-medium text-slate-300"
                      htmlFor="selectedRecruiterNotes"
                    >
                      Internal recruiter notes
                    </label>
                    <textarea
                      id="selectedRecruiterNotes"
                      rows={5}
                      value={selectedCandidate.recruiterNotes}
                      onChange={(event) =>
                        updateRecruiterNotes(
                          selectedCandidate.id,
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
                          Manual AI screening prompt
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Copy the structured prompt into ChatGPT or Claude,
                          then paste its JSON output below.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          copyCandidatePrompt(selectedCandidate)
                        }
                        className="w-fit rounded-full border border-cyan-400 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
                      >
                        Copy AI prompt
                      </button>
                    </div>

                    <textarea
                      readOnly
                      value={buildCandidateAnalysisPrompt(selectedCandidate)}
                      rows={15}
                      className="mt-4 w-full rounded-xl border border-cyan-500/20 bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-300 outline-none"
                    />

                    <div className="mt-5">
                      <label
                        className="text-sm font-medium text-cyan-100"
                        htmlFor="candidateAnalysisJson"
                      >
                        Paste AI JSON result
                      </label>
                      <textarea
                        id="candidateAnalysisJson"
                        value={
                          analysisJsonByCandidateId[selectedCandidate.id] ?? ""
                        }
                        onChange={(event) =>
                          setAnalysisJsonByCandidateId((currentDrafts) => ({
                            ...currentDrafts,
                            [selectedCandidate.id]: event.target.value,
                          }))
                        }
                        rows={10}
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
                            saveCandidateAnalysis(
                              selectedCandidate.id,
                              analysisJsonByCandidateId[selectedCandidate.id] ??
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

                  {selectedCandidate.analysis ? (
                    <AnalysisReviewCard
                      approved={selectedCandidate.analysisApproved}
                      onApprove={() =>
                        approveCandidateAnalysis(selectedCandidate.id)
                      }
                    >
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Summary
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedCandidate.analysis.summary}
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Fit score
                            </p>
                            <p className="mt-1 text-sm capitalize leading-6 text-slate-300">
                              {selectedCandidate.analysis.fitScore}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Next action
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-300">
                              {selectedCandidate.analysis.nextAction}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Strengths
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedCandidate.analysis.strengths}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Concerns or missing information
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedCandidate.analysis.concerns}
                          </p>
                        </div>

                        <CopyableOutputBox
                          title="Suggested interview questions"
                          buttonLabel="Copy interview questions"
                          onCopy={() =>
                            copyInterviewQuestions(selectedCandidate)
                          }
                        >
                          <ol className="mt-3 space-y-2">
                            {selectedCandidate.analysis.suggestedInterviewQuestions.map(
                              (question, index) => (
                                <li
                                  key={`${question}-${index}`}
                                  className="text-sm leading-6 text-slate-300"
                                >
                                  {index + 1}. {question}
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
                            {selectedCandidate.analysis.riskNote}
                          </p>
                        </div>
                      </div>
                    </AnalysisReviewCard>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="No candidates yet."
                  description="Add an application to start."
                />
              )}
            </div>
          </DemoPanel>
        </div>
      </section>
    </main>
  );
}
