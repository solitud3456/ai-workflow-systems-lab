"use client";

import { FormEvent, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";
import AnalysisReviewCard from "@/components/demo/AnalysisReviewCard";
import CopyableOutputBox from "@/components/demo/CopyableOutputBox";
import DashboardHeader from "@/components/demo/DashboardHeader";
import DemoPanel from "@/components/demo/DemoPanel";
import EmptyState from "@/components/demo/EmptyState";
import MetricCard from "@/components/demo/MetricCard";

type LeadStatus = "New" | "Contacted" | "Waiting" | "Booked" | "Lost";

type LeadAnalysis = {
  summary: string;
  urgency: "low" | "medium" | "high";
  customerIntent: string;
  suggestedReply: string;
  nextAction: string;
  riskNote: string;
};

type Lead = {
  id: number;
  name: string;
  source: string;
  message: string;
  status: LeadStatus;
  followUpDate: string;
  notes: string;
  analysis?: LeadAnalysis;
  analysisApproved: boolean;
};

const statusOptions: LeadStatus[] = [
  "New",
  "Contacted",
  "Waiting",
  "Booked",
  "Lost",
];

const initialLeads: Lead[] = [
  {
    id: 1,
    name: "Demo customer",
    source: "Website form",
    message:
      "Hi, I am interested in your service but I want to know the price and whether you are available this week.",
    status: "New",
    followUpDate: "",
    notes: "Sample lead to show the workflow before adding AI mode.",
    analysisApproved: false,
  },
];

const sampleLeadAnalysis: LeadAnalysis = {
  summary:
    "The customer is interested in the service and wants to know the price and availability.",
  urgency: "medium",
  customerIntent:
    "The customer is comparing options and may be ready to book if the price and schedule fit.",
  suggestedReply:
    "Hi, thanks for reaching out. I’d be happy to help. Could you tell me which service you are interested in and what date or time works best for you? After that, I can confirm availability and send you the correct price.",
  nextAction:
    "Ask the customer to confirm the exact service they want and their preferred date or time.",
  riskNote:
    "The customer did not provide enough details about the exact service, preferred schedule, or budget.",
};

const STORAGE_KEY = "ai-workflow-systems-lab-leads";

export default function LeadFollowUpPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(1);
  const [analysisJsonByLeadId, setAnalysisJsonByLeadId] = useState<
    Record<number, string>
  >({});
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    const savedLeads = window.localStorage.getItem(STORAGE_KEY);
    let animationFrameId: number | undefined;

    if (savedLeads) {
      try {
        const parsedLeads = JSON.parse(savedLeads) as unknown;

        if (!Array.isArray(parsedLeads)) {
          throw new Error("Saved lead data is not an array.");
        }

        const savedLeadRecords = (parsedLeads as Lead[]).map((lead) => ({
          ...lead,
          analysisApproved: lead.analysisApproved ?? false,
        }));

        animationFrameId = window.requestAnimationFrame(() => {
          setLeads(savedLeadRecords);
          setSelectedLeadId(
            savedLeadRecords[0]?.id ?? initialLeads[0].id,
          );
          setStorageReady(true);
        });
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
        animationFrameId = window.requestAnimationFrame(() => {
          setSelectedLeadId(initialLeads[0].id);
          setStorageReady(true);
        });
      }
    } else {
      animationFrameId = window.requestAnimationFrame(() => {
        setSelectedLeadId(initialLeads[0].id);
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

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
  }, [leads, storageReady]);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];
  const statusCounts = statusOptions.map((status) => ({
    status,
    count: leads.filter((lead) => lead.status === status).length,
  }));

  const reviewedCount = leads.filter((lead) => lead.analysisApproved).length;
  const analyzedCount = leads.filter((lead) => lead.analysis).length;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const newLead: Lead = {
      id: Date.now(),
      name: String(formData.get("name") || "Untitled lead"),
      source: String(formData.get("source") || "Unknown source"),
      message: String(formData.get("message") || ""),
      status: "New",
      followUpDate: String(formData.get("followUpDate") || ""),
      notes: String(formData.get("notes") || ""),
      analysisApproved: false,
    };

    setLeads((currentLeads) => [newLead, ...currentLeads]);
    setSelectedLeadId(newLead.id);
    event.currentTarget.reset();
  }

  function updateLeadStatus(id: number, status: LeadStatus) {
    setLeads((currentLeads) =>
      currentLeads.map((lead) => (lead.id === id ? { ...lead, status } : lead)),
    );
  }

  function updateLeadNotes(id: number, notes: string) {
    setLeads((currentLeads) =>
      currentLeads.map((lead) => (lead.id === id ? { ...lead, notes } : lead)),
    );
  }

  function saveLeadAnalysis(id: number, rawJson: string) {
    let analysis: LeadAnalysis;

    try {
      analysis = JSON.parse(rawJson) as LeadAnalysis;
    } catch {
      window.alert("The pasted AI output is not valid JSON. Try again.");
      return;
    }

    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === id ? { ...lead, analysis, analysisApproved: false } : lead,
      ),
    );
  }

  function approveLeadAnalysis(id: number) {
    setLeads((currentLeads) =>
      currentLeads.map((lead) =>
        lead.id === id ? { ...lead, analysisApproved: true } : lead,
      ),
    );
  }

  function deleteLead(id: number) {
    if (!window.confirm("Delete this lead?")) {
      return;
    }

    const remainingLeads = leads.filter((lead) => lead.id !== id);

    setLeads(remainingLeads);
    setAnalysisJsonByLeadId((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[id];
      return nextDrafts;
    });

    if (selectedLeadId === id) {
      setSelectedLeadId(remainingLeads[0]?.id ?? null);
    }
  }

  function resetDemoData() {
    if (
      !window.confirm("Reset all demo leads back to the default sample data?")
    ) {
      return;
    }

    setLeads(initialLeads);
    setSelectedLeadId(initialLeads[0].id);
    setAnalysisJsonByLeadId({});
  }

  function buildLeadAnalysisPrompt(lead: Lead) {
    return `You are helping analyze a customer inquiry for a small business.

Return ONLY valid JSON. Do not include markdown. Do not include extra explanation.

Customer lead:
- Name: ${lead.name}
- Source: ${lead.source}
- Current status: ${lead.status}
- Follow-up date: ${lead.followUpDate || "Not set"}
- Internal notes: ${lead.notes || "None"}
- Customer message: ${lead.message || "No message provided"}

Return JSON using this exact shape:
{
  "summary": "one-sentence summary of what the customer wants",
  "urgency": "low | medium | high",
  "customerIntent": "what the customer is probably trying to do",
  "suggestedReply": "a professional reply draft that a human can review before sending",
  "nextAction": "the next practical follow-up action for the business",
  "riskNote": "anything uncertain, missing, or risky about the inquiry"
}`;
  }

  async function copyLeadPrompt(lead: Lead) {
    await navigator.clipboard.writeText(buildLeadAnalysisPrompt(lead));
    window.alert("Prompt copied. Paste it into ChatGPT or Claude.");
  }

  async function copySampleJson() {
    await navigator.clipboard.writeText(
      JSON.stringify(sampleLeadAnalysis, null, 2),
    );
    window.alert(
      "Sample JSON copied. Paste it into the AI JSON result box.",
    );
  }

  async function copySuggestedReply(lead: Lead) {
    if (!lead.analysis) {
      return;
    }

    await navigator.clipboard.writeText(lead.analysis.suggestedReply);
    window.alert("Suggested reply copied.");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Demo 01"
          title="Lead Follow-up Assistant"
          description="A workflow demo for turning messy customer inquiries into structured lead records, reply drafts, follow-up actions, and human-reviewed next steps."
        />

        <div className="mt-10 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <DemoPanel>
            <h2 className="text-2xl font-semibold text-white">Lead intake</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Add a messy customer inquiry. Records now persist in the browser
              with localStorage. Later we will add manual AI mode and database
              storage.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="name">
                  Customer name
                </label>
                <input
                  id="name"
                  name="name"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Example: Minh / Sarah / New customer"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="source">
                  Source
                </label>
                <input
                  id="source"
                  name="source"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Website, Facebook, email, Zalo, referral..."
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="message">
                  Customer message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Paste the customer inquiry here..."
                />
              </div>

              <div>
                <label
                  className="text-sm font-medium text-slate-300"
                  htmlFor="followUpDate"
                >
                  Follow-up date
                </label>
                <input
                  id="followUpDate"
                  name="followUpDate"
                  type="date"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300" htmlFor="notes">
                  Internal notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                  placeholder="Anything the team should remember..."
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Create lead record
              </button>
            </form>
          </DemoPanel>

          <DemoPanel>
            <DashboardHeader
              title="Lead dashboard"
              description="Select a lead, update status, and keep follow-up notes."
              countLabel={`${leads.length} lead${leads.length === 1 ? "" : "s"}`}
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

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                {leads.length > 0 ? (
                  leads.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => setSelectedLeadId(lead.id)}
                      className={`w-full rounded-xl border p-4 text-left transition ${
                        selectedLead?.id === lead.id
                          ? "border-cyan-400 bg-cyan-500/10"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-white">{lead.name}</p>
                        <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                          {lead.status}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{lead.source}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
                        {lead.message}
                      </p>
                    </button>
                  ))
                ) : (
                  <EmptyState
                    title="No leads yet."
                    description="Add a customer inquiry to start."
                  />
                )}
              </div>

              {selectedLead ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                    Selected lead
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold text-white">
                    {selectedLead.name}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">{selectedLead.source}</p>
                  <button
                    type="button"
                    onClick={() => deleteLead(selectedLead.id)}
                    className="mt-4 rounded-full border border-red-400/40 px-4 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300 hover:bg-red-500/10"
                  >
                    Delete lead
                  </button>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                    <p className="text-sm font-semibold text-slate-300">
                      Customer message
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {selectedLead.message || "No message provided."}
                    </p>
                  </div>

                  <div className="mt-5">
                    <label className="text-sm font-medium text-slate-300" htmlFor="status">
                      Status
                    </label>
                    <select
                      id="status"
                      value={selectedLead.status}
                      onChange={(event) =>
                        updateLeadStatus(selectedLead.id, event.target.value as LeadStatus)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-medium text-slate-300">Follow-up date</p>
                    <p className="mt-2 text-sm text-slate-400">
                      {selectedLead.followUpDate || "No follow-up date set."}
                    </p>
                  </div>

                  <div className="mt-5">
                    <label className="text-sm font-medium text-slate-300" htmlFor="selectedNotes">
                      Internal notes
                    </label>
                    <textarea
                      id="selectedNotes"
                      rows={4}
                      value={selectedLead.notes}
                      onChange={(event) =>
                        updateLeadNotes(selectedLead.id, event.target.value)
                      }
                      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                  </div>

                  <div className="mt-5 rounded-xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-cyan-200">
                          Manual AI prompt
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          Copy this prompt into ChatGPT or Claude. Later we will
                          paste the JSON result back into the app.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => copyLeadPrompt(selectedLead)}
                        className="w-fit rounded-full border border-cyan-400 px-4 py-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-400/10"
                      >
                        Copy prompt
                      </button>
                    </div>

                    <textarea
                      readOnly
                      value={buildLeadAnalysisPrompt(selectedLead)}
                      rows={12}
                      className="mt-4 w-full rounded-xl border border-cyan-500/20 bg-slate-950 px-4 py-3 text-xs leading-6 text-slate-300 outline-none"
                    />

                    <div className="mt-5">
                      <label
                        className="text-sm font-medium text-cyan-100"
                        htmlFor="aiAnalysisJson"
                      >
                        Paste AI JSON result
                      </label>
                      <textarea
                        id="aiAnalysisJson"
                        value={analysisJsonByLeadId[selectedLead.id] ?? ""}
                        onChange={(event) =>
                          setAnalysisJsonByLeadId((currentDrafts) => ({
                            ...currentDrafts,
                            [selectedLead.id]: event.target.value,
                          }))
                        }
                        rows={8}
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
                            saveLeadAnalysis(
                              selectedLead.id,
                              analysisJsonByLeadId[selectedLead.id] ?? "",
                            )
                          }
                          className="rounded-full bg-cyan-400 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                        >
                          Save AI analysis
                        </button>
                      </div>
                    </div>
                  </div>

                  {selectedLead.analysis ? (
                    <AnalysisReviewCard
                      approved={selectedLead.analysisApproved}
                      onApprove={() =>
                        approveLeadAnalysis(selectedLead.id)
                      }
                    >
                      <div className="mt-4 space-y-4">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Summary
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedLead.analysis.summary}
                          </p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Urgency
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-300">
                              {selectedLead.analysis.urgency}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                              Customer intent
                            </p>
                            <p className="mt-1 text-sm leading-6 text-slate-300">
                              {selectedLead.analysis.customerIntent}
                            </p>
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Next action
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedLead.analysis.nextAction}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                            Risk note
                          </p>
                          <p className="mt-1 text-sm leading-6 text-slate-300">
                            {selectedLead.analysis.riskNote}
                          </p>
                        </div>

                        <CopyableOutputBox
                          title="Suggested reply"
                          buttonLabel="Copy suggested reply"
                          onCopy={() => copySuggestedReply(selectedLead)}
                        >
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-300">
                            {selectedLead.analysis.suggestedReply}
                          </p>
                        </CopyableOutputBox>
                      </div>
                    </AnalysisReviewCard>
                  ) : null}
                </div>
              ) : (
                <EmptyState
                  title="No leads yet."
                  description="Add a customer inquiry to start."
                />
              )}
            </div>
          </DemoPanel>
        </div>
      </section>
    </main>
  );
}
