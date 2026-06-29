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

const channelOptions = [
  "Email",
  "Chat",
  "Phone",
  "Web form",
  "Social",
] as const;
const issueTypeOptions = [
  "Billing",
  "Technical",
  "Account",
  "Complaint",
  "Other",
] as const;
const priorityOptions = ["Low", "Normal", "High"] as const;
const statusOptions = [
  "New",
  "Needs review",
  "Follow-up",
  "Escalated",
  "Resolved",
  "Closed",
] as const;
const sentimentOptions = [
  "positive",
  "neutral",
  "frustrated",
  "angry",
] as const;
const aiUrgencyOptions = ["low", "medium", "high"] as const;
const aiIssueTypeOptions = [
  "billing",
  "technical",
  "account",
  "complaint",
  "other",
] as const;

type SupportChannel = (typeof channelOptions)[number];
type SupportIssueType = (typeof issueTypeOptions)[number];
type SupportPriority = (typeof priorityOptions)[number];
type SupportStatus = (typeof statusOptions)[number];
type SupportSentiment = (typeof sentimentOptions)[number];
type SupportUrgency = (typeof aiUrgencyOptions)[number];
type SupportAnalysisIssueType = (typeof aiIssueTypeOptions)[number];

type SupportAnalysis = {
  summary: string;
  sentiment: SupportSentiment;
  urgency: SupportUrgency;
  issueType: SupportAnalysisIssueType;
  riskNote: string;
  nextAction: string;
  suggestedReply: string;
  escalationNeeded: boolean;
};

type SupportTicket = {
  id: number;
  customerName: string;
  channel: SupportChannel;
  issueType: SupportIssueType;
  message: string;
  priority: SupportPriority;
  status: SupportStatus;
  receivedDate: string;
  internalNotes: string;
  analysis?: SupportAnalysis;
  analysisApproved: boolean;
};

type SupabaseSyncMessage = {
  type: "success" | "error";
  text: string;
};

type SupportDemoRecordRow = {
  id: string;
  title: string | null;
  status: string | null;
  source: string | null;
  raw_input: string | null;
  internal_notes: string | null;
  analysis: unknown;
  analysis_approved: boolean | null;
};

const STORAGE_KEY = "ai-workflow-systems-lab-support-tickets";
const SUPPORT_API_ROUTE = "/api/support-records";

const initialTickets: SupportTicket[] = [
  {
    id: 1,
    customerName: "Maya Chen",
    channel: "Email",
    issueType: "Billing",
    message:
      "I was charged twice for this month's subscription. I need this fixed before the renewal date because finance is asking for a clean invoice.",
    priority: "High",
    status: "New",
    receivedDate: "2026-06-24",
    internalNotes:
      "Sample support ticket. Check billing history before replying.",
    analysisApproved: false,
  },
];

const sampleSupportAnalysis: SupportAnalysis = {
  summary:
    "The customer reports a duplicate subscription charge and needs billing help before the next renewal.",
  sentiment: "frustrated",
  urgency: "high",
  issueType: "billing",
  riskNote:
    "Billing errors can affect trust and may need account verification before a refund or invoice correction.",
  nextAction:
    "Review the account billing history, confirm whether a duplicate charge occurred, and prepare a refund or invoice correction.",
  suggestedReply:
    "Hi Maya, thanks for flagging this. I will review the billing history for your account and check whether a duplicate charge was made. If it was, I will help correct the invoice and confirm the next step with you shortly.",
  escalationNeeded: true,
};

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

function getValidOption<TOption extends string>(
  value: unknown,
  options: readonly TOption[],
  fallback: TOption,
): TOption {
  return typeof value === "string" &&
    options.some((option) => option === value)
    ? (value as TOption)
    : fallback;
}

function isSupportStatus(value: unknown): value is SupportStatus {
  return (
    typeof value === "string" &&
    statusOptions.some((status) => status === value)
  );
}

function isStringOption<TOption extends string>(
  value: unknown,
  options: readonly TOption[],
): value is TOption {
  return (
    typeof value === "string" && options.some((option) => option === value)
  );
}

function isSupportAnalysis(value: unknown): value is SupportAnalysis {
  if (!isObjectRecord(value)) {
    return false;
  }

  return (
    typeof value.summary === "string" &&
    isStringOption(value.sentiment, sentimentOptions) &&
    isStringOption(value.urgency, aiUrgencyOptions) &&
    isStringOption(value.issueType, aiIssueTypeOptions) &&
    typeof value.riskNote === "string" &&
    typeof value.nextAction === "string" &&
    typeof value.suggestedReply === "string" &&
    typeof value.escalationNeeded === "boolean"
  );
}

function parseSupportRawInput(rawInput: string | null): Record<string, unknown> {
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

function buildTicketTitle(ticket: SupportTicket) {
  return ticket.customerName.trim() || "Unknown customer";
}

function getCustomerNameSyncIssue(ticket: SupportTicket) {
  const customerName = ticket.customerName.trim();

  if (!customerName) {
    return "Customer names must not be empty.";
  }

  if (customerName.length < 3) {
    return "Customer names must be at least 3 characters.";
  }

  return null;
}

function mapTicketToDemoRecord(ticket: SupportTicket) {
  return {
    title: buildTicketTitle(ticket),
    status: ticket.status,
    source: ticket.channel,
    raw_input: JSON.stringify({
      id: ticket.id,
      customerName: ticket.customerName,
      channel: ticket.channel,
      issueType: ticket.issueType,
      message: ticket.message,
      priority: ticket.priority,
      status: ticket.status,
      receivedDate: ticket.receivedDate,
      internalNotes: ticket.internalNotes,
    }),
    internal_notes: ticket.internalNotes,
    analysis: ticket.analysis ?? null,
    analysis_approved: ticket.analysisApproved,
  };
}

function buildFallbackTicketId(index: number) {
  return Date.now() + index;
}

function mapDemoRecordToTicket(
  record: SupportDemoRecordRow,
  index: number,
  usedIds: Set<number>,
): SupportTicket {
  const rawTicket = parseSupportRawInput(record.raw_input);
  const rawId = getNumber(rawTicket.id);
  let id = rawId ?? buildFallbackTicketId(index);

  while (usedIds.has(id)) {
    id += 1;
  }

  usedIds.add(id);

  const analysis = isSupportAnalysis(record.analysis)
    ? record.analysis
    : undefined;
  const status = isSupportStatus(record.status)
    ? record.status
    : isSupportStatus(rawTicket.status)
      ? rawTicket.status
      : "New";

  return {
    id,
    customerName:
      getString(rawTicket.customerName) || record.title || "Supabase customer",
    channel: getValidOption(
      getString(rawTicket.channel) || record.source,
      channelOptions,
      "Email",
    ),
    issueType: getValidOption(rawTicket.issueType, issueTypeOptions, "Other"),
    message: getString(rawTicket.message) || "",
    priority: getValidOption(rawTicket.priority, priorityOptions, "Normal"),
    status,
    receivedDate: getString(rawTicket.receivedDate) || "",
    internalNotes:
      record.internal_notes || getString(rawTicket.internalNotes) || "",
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

export default function SupportTicketPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>(initialTickets);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(
    initialTickets[0].id,
  );
  const [analysisJsonByTicketId, setAnalysisJsonByTicketId] = useState<
    Record<number, string>
  >({});
  const [storageReady, setStorageReady] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] =
    useState<SupabaseSyncMessage | null>(null);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);

  useEffect(() => {
    const savedTickets = window.localStorage.getItem(STORAGE_KEY);
    let animationFrameId: number | undefined;

    if (savedTickets) {
      try {
        const parsedTickets = JSON.parse(savedTickets) as unknown;

        if (!Array.isArray(parsedTickets)) {
          throw new Error("Saved support ticket data is not an array.");
        }

        const savedTicketRecords = (parsedTickets as SupportTicket[]).map(
          (ticket) => ({
            ...ticket,
            receivedDate: ticket.receivedDate ?? "",
            internalNotes: ticket.internalNotes ?? "",
            analysisApproved: ticket.analysisApproved ?? false,
          }),
        );

        animationFrameId = window.requestAnimationFrame(() => {
          setTickets(savedTicketRecords);
          setSelectedTicketId(savedTicketRecords[0]?.id ?? null);
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

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }, [tickets, storageReady]);

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? tickets[0];
  const statusCounts = statusOptions.map((status) => ({
    status,
    count: tickets.filter((ticket) => ticket.status === status).length,
  }));
  const analyzedCount = tickets.filter((ticket) => ticket.analysis).length;
  const reviewedCount = tickets.filter(
    (ticket) => ticket.analysisApproved,
  ).length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const message = String(formData.get("message") || "").trim();

    if (!message) {
      window.alert("Add the customer message before creating a ticket.");
      return;
    }

    const newTicket: SupportTicket = {
      id: Date.now(),
      customerName: String(formData.get("customerName") || "Unknown customer"),
      channel: getValidOption(
        formData.get("channel"),
        channelOptions,
        "Email",
      ),
      issueType: getValidOption(
        formData.get("issueType"),
        issueTypeOptions,
        "Other",
      ),
      message,
      priority: getValidOption(
        formData.get("priority"),
        priorityOptions,
        "Normal",
      ),
      status: "New",
      receivedDate: String(formData.get("receivedDate") || ""),
      internalNotes: String(formData.get("internalNotes") || ""),
      analysisApproved: false,
    };

    setTickets((currentTickets) => [newTicket, ...currentTickets]);
    setSelectedTicketId(newTicket.id);
    event.currentTarget.reset();
  }

  function updateTicketStatus(id: number, status: SupportStatus) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === id ? { ...ticket, status } : ticket,
      ),
    );
  }

  function updateInternalNotes(id: number, internalNotes: string) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === id ? { ...ticket, internalNotes } : ticket,
      ),
    );
  }

  function saveTicketAnalysis(id: number, rawJson: string) {
    let parsedAnalysis: unknown;

    try {
      parsedAnalysis = JSON.parse(rawJson);
    } catch {
      window.alert("The pasted AI output is not valid JSON. Try again.");
      return;
    }

    if (!isSupportAnalysis(parsedAnalysis)) {
      window.alert("The pasted AI output is not valid JSON. Try again.");
      return;
    }

    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === id
          ? {
              ...ticket,
              analysis: parsedAnalysis,
              analysisApproved: false,
            }
          : ticket,
      ),
    );
  }

  function approveTicketAnalysis(id: number) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === id
          ? { ...ticket, analysisApproved: true }
          : ticket,
      ),
    );
  }

  function deleteTicket(id: number) {
    if (!window.confirm("Delete this support ticket?")) {
      return;
    }

    const remainingTickets = tickets.filter((ticket) => ticket.id !== id);

    setTickets(remainingTickets);
    setAnalysisJsonByTicketId((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[id];
      return nextDrafts;
    });

    if (selectedTicketId === id) {
      setSelectedTicketId(remainingTickets[0]?.id ?? null);
    }
  }

  function resetDemoData() {
    if (
      !window.confirm(
        "Reset all support tickets back to the default sample data?",
      )
    ) {
      return;
    }

    setTickets(initialTickets);
    setSelectedTicketId(initialTickets[0].id);
    setAnalysisJsonByTicketId({});
  }

  function buildSupportPrompt(ticket: SupportTicket) {
    return `You are helping triage a customer support ticket for human review.

Use only the provided ticket details. Do not invent account history, refunds, technical causes, or policy decisions. Keep the reply short and practical.

Return ONLY valid JSON. Do not include markdown. Do not include extra explanation.

Support ticket:
- Customer name: ${ticket.customerName}
- Channel: ${ticket.channel}
- Issue type: ${ticket.issueType}
- Priority: ${ticket.priority}
- Received date: ${ticket.receivedDate || "Not set"}
- Current status: ${ticket.status}
- Internal notes: ${ticket.internalNotes || "None"}
- Customer message: ${ticket.message}

Return JSON using this exact shape:
{
  "summary": "short summary",
  "sentiment": "positive | neutral | frustrated | angry",
  "urgency": "low | medium | high",
  "issueType": "billing | technical | account | complaint | other",
  "riskNote": "what could go wrong or what needs human attention",
  "nextAction": "specific next action",
  "suggestedReply": "short customer reply",
  "escalationNeeded": true
}`;
  }

  async function copySupportPrompt(ticket: SupportTicket) {
    await navigator.clipboard.writeText(buildSupportPrompt(ticket));
    window.alert("Prompt copied. Paste it into ChatGPT or Claude.");
  }

  async function copySampleJson() {
    await navigator.clipboard.writeText(
      JSON.stringify(sampleSupportAnalysis, null, 2),
    );
    window.alert(
      "Sample JSON copied. Paste it into the AI JSON result box.",
    );
  }

  async function copySuggestedReply(ticket: SupportTicket) {
    if (!ticket.analysis) {
      return;
    }

    await navigator.clipboard.writeText(ticket.analysis.suggestedReply);
    window.alert("Suggested reply copied.");
  }

  async function saveCurrentTicketsToSupabase() {
    if (!storageReady) {
      setSupabaseSyncMessage({
        type: "error",
        text: "Local support ticket data is still loading. Try again in a moment.",
      });
      return;
    }

    if (tickets.length === 0) {
      setSupabaseSyncMessage({
        type: "error",
        text: "There are no support tickets to save to Supabase yet.",
      });
      return;
    }

    const validTickets = tickets.filter(
      (ticket) => !getCustomerNameSyncIssue(ticket),
    );
    const skippedCount = tickets.length - validTickets.length;

    if (validTickets.length === 0) {
      setSupabaseSyncMessage({
        type: "error",
        text: "Supabase save was not started. Add at least one support ticket with a customer name of 3 or more characters.",
      });
      return;
    }

    setIsSupabaseSyncing(true);
    setSupabaseSyncMessage(null);

    try {
      const response = await fetch(SUPPORT_API_ROUTE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          records: validTickets.map(mapTicketToDemoRecord),
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
          : validTickets.length;
      const skippedText =
        skippedCount > 0
          ? ` Skipped ${skippedCount} ticket${skippedCount === 1 ? "" : "s"} with missing or invalid customer names.`
          : "";

      setSupabaseSyncMessage({
        type: "success",
        text: `Saved ${savedCount} support ticket${savedCount === 1 ? "" : "s"} to Supabase through the internal API route.${skippedText} Your local browser workspace remains active.`,
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

  async function loadTicketsFromSupabase() {
    if (!storageReady) {
      setSupabaseSyncMessage({
        type: "error",
        text: "Local support ticket data is still loading. Try again in a moment.",
      });
      return;
    }

    if (
      !window.confirm(
        "Load support tickets from Supabase? This will replace the current local demo state in this browser.",
      )
    ) {
      return;
    }

    setIsSupabaseSyncing(true);
    setSupabaseSyncMessage(null);

    try {
      const response = await fetch(SUPPORT_API_ROUTE);
      const responseBody = (await response.json()) as unknown;

      if (!response.ok) {
        setSupabaseSyncMessage({
          type: "error",
          text: `${getApiErrorMessage(responseBody, "Supabase load failed.")} Current localStorage tickets were not changed.`,
        });
        return;
      }

      if (!isObjectRecord(responseBody) || !Array.isArray(responseBody.records)) {
        setSupabaseSyncMessage({
          type: "error",
          text: "Supabase load failed: the API response did not include a records array. Current localStorage tickets were not changed.",
        });
        return;
      }

      const records = responseBody.records as SupportDemoRecordRow[];

      if (records.length === 0) {
        setSupabaseSyncMessage({
          type: "success",
          text: "No support ticket records were found in Supabase. Current local demo state was not changed.",
        });
        return;
      }

      const usedIds = new Set<number>();
      const loadedTickets = records.map((record, index) =>
        mapDemoRecordToTicket(record, index, usedIds),
      );

      setTickets(loadedTickets);
      setSelectedTicketId(loadedTickets[0]?.id ?? null);
      setAnalysisJsonByTicketId({});
      setSupabaseSyncMessage({
        type: "success",
        text: `Loaded ${loadedTickets.length} support ticket${loadedTickets.length === 1 ? "" : "s"} from Supabase. This replaced the current local demo state and will continue saving to localStorage.`,
      });
    } catch (error) {
      setSupabaseSyncMessage({
        type: "error",
        text: `Supabase load failed: ${getSyncErrorMessage(error)}. Current localStorage tickets were not changed.`,
      });
    } finally {
      setIsSupabaseSyncing(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Demo 04"
          title="Support Ticket Assistant"
          description="A manual-AI workflow demo for triaging customer support messages into summaries, risk notes, next actions, and reviewed reply drafts."
        />

        <div className="mt-10 grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
          <DemoPanel>
            <h2 className="text-2xl font-semibold text-white">
              Support intake
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Capture a customer issue, then use manual AI JSON to structure the
              next step.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="customerName"
                >
                  Customer name
                </label>
                <input
                  id="customerName"
                  name="customerName"
                  required
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Example: Maya Chen"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-300">
                  <span>Channel</span>
                  <select
                    name="channel"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    {channelOptions.map((channel) => (
                      <option key={channel} value={channel}>
                        {channel}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium text-slate-300">
                  <span>Issue type</span>
                  <select
                    name="issueType"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    {issueTypeOptions.map((issueType) => (
                      <option key={issueType} value={issueType}>
                        {issueType}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-300">
                  <span>Priority</span>
                  <select
                    name="priority"
                    defaultValue="Normal"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  >
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>

                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="receivedDate"
                >
                  Received date
                  <input
                    id="receivedDate"
                    name="receivedDate"
                    type="date"
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  />
                </label>
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="message"
                >
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Paste the customer message here..."
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
                  placeholder="Account context, prior contact, or handling notes..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Create support ticket
              </button>
            </form>
          </DemoPanel>

          <DemoPanel>
            <DashboardHeader
              title="Support dashboard"
              description="Track ticket status, saved AI analysis, and human approval."
              countLabel={`${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`}
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
                <div>
                  <p className="text-sm font-semibold text-cyan-200">
                    Optional Supabase sync
                  </p>
                  <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-400">
                    localStorage is the main demo workspace. Saving sends
                    current local tickets to the database; loading replaces the
                    current local ticket state after confirmation.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={saveCurrentTicketsToSupabase}
                    disabled={isSupabaseSyncing}
                    className="rounded-full border border-cyan-400/60 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Save current tickets to Supabase
                  </button>
                  <button
                    type="button"
                    onClick={loadTicketsFromSupabase}
                    disabled={isSupabaseSyncing}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Load tickets from Supabase
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
                {tickets.length > 0 ? (
                  tickets.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => setSelectedTicketId(ticket.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedTicket?.id === ticket.id
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">
                          {ticket.customerName}
                        </p>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                          {ticket.status}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-slate-300">
                        {ticket.issueType} / {ticket.priority}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {ticket.channel}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {ticket.message}
                      </p>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="No support tickets yet."
                    description="Add a customer message to start."
                  />
                )}
              </div>

              {selectedTicket ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Selected ticket
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {selectedTicket.customerName}
                  </h3>
                  <p className="mt-2 text-sm text-slate-300">
                    {selectedTicket.issueType} via {selectedTicket.channel}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Priority: {selectedTicket.priority}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Received: {selectedTicket.receivedDate || "Not set"}
                  </p>

                  <button
                    type="button"
                    onClick={() => deleteTicket(selectedTicket.id)}
                    className="mt-4 rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:bg-red-500/10"
                  >
                    Delete ticket
                  </button>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <p className="text-sm font-semibold text-slate-300">
                      Customer message
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                      {selectedTicket.message}
                    </p>
                  </div>

                  <StatusSelect
                    label="Status"
                    value={selectedTicket.status}
                    options={statusOptions}
                    onChange={(status) =>
                      updateTicketStatus(selectedTicket.id, status)
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
                      value={selectedTicket.internalNotes}
                      onChange={(event) =>
                        updateInternalNotes(
                          selectedTicket.id,
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
                        onClick={() => copySupportPrompt(selectedTicket)}
                        className="w-fit rounded-full border border-cyan-400/40 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                      >
                        Copy prompt
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={buildSupportPrompt(selectedTicket)}
                      rows={10}
                      className="mt-3 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-300 outline-none"
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          Paste AI JSON result
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Testing the demo? Copy sample JSON, paste it below,
                          then save the analysis.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={copySampleJson}
                        className="w-fit rounded-full border border-cyan-400/40 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:bg-cyan-500/10"
                      >
                        Copy sample JSON
                      </button>
                    </div>
                    <textarea
                      value={analysisJsonByTicketId[selectedTicket.id] ?? ""}
                      onChange={(event) =>
                        setAnalysisJsonByTicketId((currentDrafts) => ({
                          ...currentDrafts,
                          [selectedTicket.id]: event.target.value,
                        }))
                      }
                      rows={8}
                      className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition focus:border-cyan-400"
                      placeholder='{"summary":"...","sentiment":"neutral","urgency":"medium",...}'
                    />
                    <button
                      type="button"
                      onClick={() =>
                        saveTicketAnalysis(
                          selectedTicket.id,
                          analysisJsonByTicketId[selectedTicket.id] ?? "",
                        )
                      }
                      className="mt-3 rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                    >
                      Save AI analysis
                    </button>
                  </div>

                  {selectedTicket.analysis ? (
                    <AnalysisReviewCard
                      approved={selectedTicket.analysisApproved}
                      onApprove={() =>
                        approveTicketAnalysis(selectedTicket.id)
                      }
                    >
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Sentiment
                          </p>
                          <p className="mt-2 text-sm text-white">
                            {selectedTicket.analysis.sentiment}
                          </p>
                        </div>
                        <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Urgency
                          </p>
                          <p className="mt-2 text-sm text-white">
                            {selectedTicket.analysis.urgency}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
                        <p>
                          <span className="font-semibold text-white">
                            Summary:
                          </span>{" "}
                          {selectedTicket.analysis.summary}
                        </p>
                        <p>
                          <span className="font-semibold text-white">
                            Issue type:
                          </span>{" "}
                          {selectedTicket.analysis.issueType}
                        </p>
                        <p>
                          <span className="font-semibold text-white">
                            Next action:
                          </span>{" "}
                          {selectedTicket.analysis.nextAction}
                        </p>
                        <p>
                          <span className="font-semibold text-white">
                            Risk note:
                          </span>{" "}
                          {selectedTicket.analysis.riskNote}
                        </p>
                        <p>
                          <span className="font-semibold text-white">
                            Escalation needed:
                          </span>{" "}
                          {selectedTicket.analysis.escalationNeeded
                            ? "Yes"
                            : "No"}
                        </p>
                      </div>

                      <div className="mt-4">
                        <CopyableOutputBox
                          title="Suggested reply draft"
                          buttonLabel="Copy suggested reply"
                          onCopy={() => copySuggestedReply(selectedTicket)}
                        >
                          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                            {selectedTicket.analysis.suggestedReply}
                          </p>
                        </CopyableOutputBox>
                      </div>
                    </AnalysisReviewCard>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="No ticket selected."
                  description="Create or select a support ticket to review."
                />
              )}
            </div>
          </DemoPanel>
        </div>
      </section>
    </main>
  );
}
