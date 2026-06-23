"use client";

import { FormEvent, useState } from "react";
import PageHeader from "@/components/PageHeader";

type LeadStatus = "New" | "Contacted" | "Waiting" | "Booked" | "Lost";

type Lead = {
  id: number;
  name: string;
  source: string;
  message: string;
  status: LeadStatus;
  followUpDate: string;
  notes: string;
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
  },
];

export default function LeadFollowUpPage() {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selectedLeadId, setSelectedLeadId] = useState<number>(1);

  const selectedLead = leads.find((lead) => lead.id === selectedLeadId) ?? leads[0];

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

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-7xl">
        <PageHeader
          eyebrow="Demo 01"
          title="Lead Follow-up Assistant"
          description="A workflow demo for turning messy customer inquiries into structured lead records, reply drafts, follow-up actions, and human-reviewed next steps."
        />

        <div className="mt-10 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <h2 className="text-2xl font-semibold text-white">Lead intake</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Add a messy customer inquiry. For now this uses local React state.
              Later we will add manual AI mode and persistence.
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
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-white">Lead dashboard</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Select a lead, update status, and keep follow-up notes.
                </p>
              </div>
              <span className="w-fit rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                {leads.length} lead{leads.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-3">
                {leads.map((lead) => (
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
                ))}
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
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}