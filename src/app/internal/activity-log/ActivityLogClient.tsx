"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import PageHeader from "@/components/PageHeader";

type DemoRecordEvent = {
  id: string;
  demo_record_id: string | null;
  demo_type: string;
  action: string;
  title: string | null;
  details: unknown;
  created_at: string | null;
};

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

  return "Unknown error while loading activity events.";
}

function getApiError(body: unknown, fallback: string) {
  if (isObjectRecord(body) && typeof body.error === "string") {
    return body.error;
  }

  return fallback;
}

function normalizeEvent(value: unknown, index: number): DemoRecordEvent {
  const event = isObjectRecord(value) ? value : {};

  return {
    id: getString(event.id, `event-${index}`),
    demo_record_id: getNullableString(event.demo_record_id),
    demo_type: getString(event.demo_type, "unknown"),
    action: getString(event.action, "unknown"),
    title: getNullableString(event.title),
    details: event.details ?? null,
    created_at: getNullableString(event.created_at),
  };
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

function formatDetails(details: unknown) {
  if (!details) {
    return "{}";
  }

  return JSON.stringify(details, null, 2);
}

function getActionBadgeClass(action: string) {
  if (action === "deleted" || action === "task_deleted") {
    return "rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200";
  }

  if (action === "task_completed") {
    return "rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300";
  }

  if (action === "task_created" || action === "bulk_tasks_generated") {
    return "rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200";
  }

  return "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200";
}

async function fetchEvents() {
  const response = await fetch("/api/demo-record-events", {
    cache: "no-store",
  });

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The API response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error(getApiError(body, "The event API request failed."));
  }

  if (!isObjectRecord(body) || body.ok !== true || !Array.isArray(body.events)) {
    throw new Error("The API response did not include an events array.");
  }

  return body.events.map(normalizeEvent);
}

function ActivityEventCard({ event }: { event: DemoRecordEvent }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              {event.demo_type}
            </span>
            <span className={getActionBadgeClass(event.action)}>
              {event.action}
            </span>
          </div>

          <h3 className="mt-3 text-base font-semibold text-white">
            {event.title || "Untitled event"}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Related record id: {event.demo_record_id || "Not set"}
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            created_at
          </p>
          <p className="mt-1 text-slate-300">{formatDate(event.created_at)}</p>
        </div>
      </div>

      <details className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3">
        <summary className="cursor-pointer text-sm font-semibold text-cyan-200">
          Details JSON
        </summary>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap text-xs leading-5 text-slate-300">
          {formatDetails(event.details)}
        </pre>
      </details>
    </article>
  );
}

export default function ActivityLogClient() {
  const [events, setEvents] = useState<DemoRecordEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const nextEvents = await fetchEvents();

      setEvents(nextEvents);
      setLastLoadedAt(new Date().toLocaleString());
    } catch (error) {
      setEvents([]);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadEvents();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadEvents]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            eyebrow="Internal"
            title="Activity Log"
            description="A development-only audit trail for internal Supabase record, task, and automation events across the workflow demos."
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:min-w-64">
            <button
              type="button"
              onClick={loadEvents}
              disabled={isLoading}
              className="w-full rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "Refresh activity"}
            </button>
            <Link
              href="/internal/demo-records"
              className="mt-3 block rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Open records viewer
            </Link>
            <Link
              href="/internal/review-queue"
              className="mt-3 block rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Open review queue
            </Link>
            <Link
              href="/internal/workflow-board"
              className="mt-3 block rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Open workflow board
            </Link>
            <Link
              href="/internal/task-queue"
              className="mt-3 block rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Open task queue
            </Link>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {lastLoadedAt
                ? `Last refreshed: ${lastLoadedAt}`
                : "Activity loads automatically on page open."}
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
          <h2 className="text-base font-semibold text-white">
            Internal audit trail
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Events are written by server-side API routes after internal record
            edits, task actions, and task automation. GET requests and public
            demo localStorage changes are not logged here.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Recent events
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Newest events from optional Supabase persistence.
              </p>
            </div>

            <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-cyan-200">
              {events.length} {events.length === 1 ? "event" : "events"}
            </span>
          </div>

          {isLoading ? (
            <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              Loading activity events...
            </p>
          ) : errorMessage ? (
            <p className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              {errorMessage}
            </p>
          ) : events.length === 0 ? (
            <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
              No activity events found yet.
            </p>
          ) : (
            <div className="mt-5 grid gap-4">
              {events.map((event) => (
                <ActivityEventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
