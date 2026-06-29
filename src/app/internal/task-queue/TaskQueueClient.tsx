"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";

const taskStatuses = ["Open", "In progress", "Done", "Blocked"] as const;
const taskPriorities = ["Low", "Normal", "High"] as const;
const workflowOptions = [
  {
    key: "lead",
    label: "Lead Follow-up",
    demoType: "lead_follow_up",
  },
  {
    key: "recruitment",
    label: "Recruitment Workflow",
    demoType: "recruitment_assistant",
  },
  {
    key: "document",
    label: "Document Intake",
    demoType: "document_intake",
  },
  {
    key: "support",
    label: "Support Ticket",
    demoType: "support_ticket",
  },
  {
    key: "invoice",
    label: "Invoice Follow-up",
    demoType: "invoice_follow_up",
  },
  {
    key: "meeting",
    label: "Meeting Action",
    demoType: "meeting_actions",
  },
  {
    key: "it",
    label: "IT Request",
    demoType: "it_request",
  },
  {
    key: "vendor",
    label: "Vendor Request",
    demoType: "vendor_request",
  },
] as const;

type WorkflowFilter = "all" | (typeof workflowOptions)[number]["key"];
type TaskStatusFilter = "all" | (typeof taskStatuses)[number];
type TaskPriorityFilter = "all" | (typeof taskPriorities)[number];

type DemoTask = {
  id: string;
  demo_record_id: string | null;
  demo_type: string;
  title: string;
  status: string;
  priority: string;
  source_record_title: string | null;
  notes: string | null;
  due_date: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type TaskFormState = {
  title: string;
  demo_type: string;
  status: string;
  priority: string;
  source_record_title: string;
  notes: string;
  due_date: string;
};

type EditFormState = {
  title: string;
  status: string;
  priority: string;
  notes: string;
  due_date: string;
};

type TaskUpdatePayload = {
  title?: string;
  status?: string;
  priority?: string;
  notes?: string | null;
  due_date?: string | null;
};

type ActionMessage = {
  kind: "success" | "error";
  text: string;
  showActivityLogLink?: boolean;
} | null;

type WorkflowAutomationRunResult = {
  recordsScanned: number;
  statusesUpdated: number;
  tasksCreated: number;
  duplicatesSkipped: number;
};

const emptyTaskForm: TaskFormState = {
  title: "",
  demo_type: "lead_follow_up",
  status: "Open",
  priority: "Normal",
  source_record_title: "",
  notes: "",
  due_date: "",
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

  return "Unknown error while loading tasks.";
}

function getApiError(body: unknown, fallback: string) {
  if (isObjectRecord(body) && typeof body.error === "string") {
    return body.error;
  }

  return fallback;
}

function normalizeTask(value: unknown, index: number): DemoTask {
  const task = isObjectRecord(value) ? value : {};

  return {
    id: getString(task.id, `task-${index}`),
    demo_record_id: getNullableString(task.demo_record_id),
    demo_type: getString(task.demo_type, "unknown"),
    title: getString(task.title, "Untitled task"),
    status: getString(task.status, "Open"),
    priority: getString(task.priority, "Normal"),
    source_record_title: getNullableString(task.source_record_title),
    notes: getNullableString(task.notes),
    due_date: getNullableString(task.due_date),
    created_at: getNullableString(task.created_at),
    updated_at: getNullableString(task.updated_at),
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

function getWorkflowLabel(demoType: string) {
  return (
    workflowOptions.find((workflow) => workflow.demoType === demoType)?.label ??
    demoType
  );
}

function getWorkflowKey(demoType: string) {
  return workflowOptions.find((workflow) => workflow.demoType === demoType)?.key;
}

function buildEditForm(task: DemoTask): EditFormState {
  return {
    title: task.title,
    status: task.status,
    priority: task.priority,
    notes: task.notes ?? "",
    due_date: task.due_date ?? "",
  };
}

function buildTaskPayload(form: TaskFormState) {
  return {
    demo_record_id: null,
    demo_type: form.demo_type,
    title: form.title.trim(),
    status: form.status,
    priority: form.priority,
    source_record_title: form.source_record_title.trim() || null,
    notes: form.notes.trim() || null,
    due_date: form.due_date || null,
  };
}

function buildUpdatePayload(form: EditFormState) {
  return {
    title: form.title.trim(),
    status: form.status,
    priority: form.priority,
    notes: form.notes.trim() || null,
    due_date: form.due_date || null,
  };
}

async function fetchTasks() {
  const response = await fetch("/api/demo-tasks", {
    cache: "no-store",
  });
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The API response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error(getApiError(body, "The task API request failed."));
  }

  if (!isObjectRecord(body) || body.ok !== true || !Array.isArray(body.tasks)) {
    throw new Error("The API response did not include a tasks array.");
  }

  return body.tasks.map(normalizeTask);
}

async function createTask(form: TaskFormState) {
  const response = await fetch("/api/demo-tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildTaskPayload(form)),
  });
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The API response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error(getApiError(body, "The task create request failed."));
  }
}

async function updateTask(id: string, updates: TaskUpdatePayload) {
  const response = await fetch(`/api/demo-tasks?id=${encodeURIComponent(id)}`, {
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
    throw new Error(getApiError(body, "The task update request failed."));
  }
}

async function deleteTask(id: string) {
  const response = await fetch(`/api/demo-tasks?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The API response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error(getApiError(body, "The task delete request failed."));
  }
}

async function runWorkflowAutomation() {
  const response = await fetch("/api/automation/run-workflow-automation", {
    method: "POST",
  });
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    throw new Error("The API response was not valid JSON.");
  }

  if (!response.ok) {
    throw new Error(
      getApiError(body, "The workflow automation request failed."),
    );
  }

  if (!isObjectRecord(body) || body.ok !== true) {
    throw new Error("The API response did not confirm workflow automation.");
  }

  return {
    recordsScanned:
      typeof body.recordsScanned === "number" ? body.recordsScanned : 0,
    statusesUpdated:
      typeof body.statusesUpdated === "number" ? body.statusesUpdated : 0,
    tasksCreated:
      typeof body.tasksCreated === "number" ? body.tasksCreated : 0,
    duplicatesSkipped:
      typeof body.duplicatesSkipped === "number"
        ? body.duplicatesSkipped
        : 0,
  } satisfies WorkflowAutomationRunResult;
}

function getWorkflowAutomationMessage(result: WorkflowAutomationRunResult) {
  return `Automation complete: ${result.recordsScanned} record${
    result.recordsScanned === 1 ? "" : "s"
  } scanned, ${result.statusesUpdated} record${
    result.statusesUpdated === 1 ? "" : "s"
  } updated, ${result.tasksCreated} task${
    result.tasksCreated === 1 ? "" : "s"
  } created, ${result.duplicatesSkipped} duplicate task${
    result.duplicatesSkipped === 1 ? "" : "s"
  } skipped.`;
}

function TaskCard({
  task,
  editForm,
  isEditing,
  isSaving,
  onCancelEdit,
  onDelete,
  onEdit,
  onEditFormChange,
  onMarkDone,
  onSaveEdit,
}: {
  task: DemoTask;
  editForm: EditFormState | null;
  isEditing: boolean;
  isSaving: boolean;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onEditFormChange: (updates: Partial<EditFormState>) => void;
  onMarkDone: () => void;
  onSaveEdit: () => void;
}) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-200">
              {getWorkflowLabel(task.demo_type)}
            </span>
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-slate-300">
              {task.status}
            </span>
            <span
              className={
                task.priority === "High"
                  ? "rounded-full bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-200"
                  : task.priority === "Low"
                    ? "rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300"
                    : "rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-200"
              }
            >
              {task.priority}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-semibold text-white">
            {task.title}
          </h3>
          <p className="mt-1 text-sm text-slate-400">
            Source record: {task.source_record_title || "Manual task"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onMarkDone}
            disabled={isSaving || task.status === "Done"}
            className="rounded-full border border-emerald-400/50 px-3 py-1 text-xs font-semibold text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark done
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={isSaving}
            className="rounded-full border border-cyan-400/50 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={isSaving}
            className="rounded-full border border-rose-400/50 px-3 py-1 text-xs font-semibold text-rose-200 transition hover:border-rose-300 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            due_date
          </p>
          <p className="mt-1 text-slate-300">{task.due_date || "Not set"}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            created_at
          </p>
          <p className="mt-1 text-slate-300">{formatDate(task.created_at)}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 lg:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            updated_at
          </p>
          <p className="mt-1 text-slate-300">{formatDate(task.updated_at)}</p>
        </div>
      </div>

      {task.notes ? (
        <p className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-sm leading-6 text-slate-300">
          {task.notes}
        </p>
      ) : null}

      {isEditing && editForm ? (
        <div className="mt-4 rounded-lg border border-cyan-500/20 bg-cyan-500/10 p-4">
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-slate-200 md:col-span-3">
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
              <select
                value={editForm.status}
                onChange={(event) =>
                  onEditFormChange({
                    status: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-200">
              Priority
              <select
                value={editForm.priority}
                onChange={(event) =>
                  onEditFormChange({
                    priority: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-semibold text-slate-200">
              Due date
              <input
                type="date"
                value={editForm.due_date}
                onChange={(event) =>
                  onEditFormChange({
                    due_date: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-semibold text-slate-200">
            Notes
            <textarea
              value={editForm.notes}
              onChange={(event) =>
                onEditFormChange({
                  notes: event.target.value,
                })
              }
              rows={4}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
            />
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={isSaving || !editForm.title.trim()}
              className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save task"}
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
    </article>
  );
}

export default function TaskQueueClient() {
  const [tasks, setTasks] = useState<DemoTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<ActionMessage>(null);
  const [createForm, setCreateForm] = useState<TaskFormState>(emptyTaskForm);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState | null>(null);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [isRunningWorkflowAutomation, setIsRunningWorkflowAutomation] =
    useState(false);
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [priorityFilter, setPriorityFilter] =
    useState<TaskPriorityFilter>("all");
  const [workflowFilter, setWorkflowFilter] =
    useState<WorkflowFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTasks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      if (statusFilter !== "all" && task.status !== statusFilter) {
        return false;
      }

      if (priorityFilter !== "all" && task.priority !== priorityFilter) {
        return false;
      }

      if (
        workflowFilter !== "all" &&
        getWorkflowKey(task.demo_type) !== workflowFilter
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        task.title,
        task.notes,
        task.source_record_title,
        task.status,
        task.priority,
        getWorkflowLabel(task.demo_type),
      ]
        .filter((item): item is string => Boolean(item))
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [priorityFilter, searchTerm, statusFilter, tasks, workflowFilter]);

  const openCount = tasks.filter((task) => task.status !== "Done").length;
  const doneCount = tasks.filter((task) => task.status === "Done").length;

  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setActionMessage(null);

    try {
      const nextTasks = await fetchTasks();

      setTasks(nextTasks);
      setLastLoadedAt(new Date().toLocaleString());
    } catch (error) {
      setTasks([]);
      setActionMessage({
        kind: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCreateTask = useCallback(async () => {
    if (!createForm.title.trim()) {
      setActionMessage({
        kind: "error",
        text: "Task title is required.",
      });
      return;
    }

    setSavingTaskId("new");
    setActionMessage(null);

    try {
      await createTask(createForm);
      setActionMessage({
        kind: "success",
        text: "Task created.",
      });
      setCreateForm(emptyTaskForm);
      await loadTasks();
    } catch (error) {
      setActionMessage({
        kind: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setSavingTaskId(null);
    }
  }, [createForm, loadTasks]);

  const handleRunWorkflowAutomation = useCallback(async () => {
    const confirmed = window.confirm("Run automation now?");

    if (!confirmed) {
      return;
    }

    setIsRunningWorkflowAutomation(true);
    setActionMessage(null);

    try {
      const result = await runWorkflowAutomation();

      setActionMessage({
        kind: "success",
        text: getWorkflowAutomationMessage(result),
        showActivityLogLink: true,
      });
      await loadTasks();
    } catch (error) {
      setActionMessage({
        kind: "error",
        text: getErrorMessage(error),
      });
    } finally {
      setIsRunningWorkflowAutomation(false);
    }
  }, [loadTasks]);

  const handleStartEdit = useCallback((task: DemoTask) => {
    setActionMessage(null);
    setEditingTaskId(task.id);
    setEditForm(buildEditForm(task));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingTaskId(null);
    setEditForm(null);
  }, []);

  const handleSaveEdit = useCallback(
    async (task: DemoTask) => {
      if (!editForm || editingTaskId !== task.id) {
        return;
      }

      if (!editForm.title.trim()) {
        setActionMessage({
          kind: "error",
          text: "Task title is required.",
        });
        return;
      }

      setSavingTaskId(task.id);
      setActionMessage(null);

      try {
        await updateTask(task.id, buildUpdatePayload(editForm));
        setActionMessage({
          kind: "success",
          text: `Updated "${editForm.title}".`,
        });
        setEditingTaskId(null);
        setEditForm(null);
        await loadTasks();
      } catch (error) {
        setActionMessage({
          kind: "error",
          text: getErrorMessage(error),
        });
      } finally {
        setSavingTaskId(null);
      }
    },
    [editForm, editingTaskId, loadTasks],
  );

  const handleMarkDone = useCallback(
    async (task: DemoTask) => {
      setSavingTaskId(task.id);
      setActionMessage(null);

      try {
        await updateTask(task.id, {
          status: "Done",
        });
        setActionMessage({
          kind: "success",
          text: `Marked "${task.title}" done.`,
        });
        await loadTasks();
      } catch (error) {
        setActionMessage({
          kind: "error",
          text: getErrorMessage(error),
        });
      } finally {
        setSavingTaskId(null);
      }
    },
    [loadTasks],
  );

  const handleDeleteTask = useCallback(
    async (task: DemoTask) => {
      const confirmed = window.confirm(`Delete "${task.title}"?`);

      if (!confirmed) {
        return;
      }

      setSavingTaskId(task.id);
      setActionMessage(null);

      try {
        await deleteTask(task.id);
        setActionMessage({
          kind: "success",
          text: `Deleted "${task.title}".`,
        });
        await loadTasks();
      } catch (error) {
        setActionMessage({
          kind: "error",
          text: getErrorMessage(error),
        });
      } finally {
        setSavingTaskId(null);
      }
    },
    [loadTasks],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadTasks();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadTasks]);

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-20 text-slate-100">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <PageHeader
            eyebrow="Internal"
            title="Command Center"
            description="Run automation, manage tasks, and create manual follow-up work."
          />

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 lg:min-w-64">
            <button
              type="button"
              onClick={loadTasks}
              disabled={isLoading}
              className="w-full rounded-lg border border-cyan-400/50 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:border-cyan-300 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Loading..." : "Refresh tasks"}
            </button>
            <Link
              href="/internal"
              className="mt-3 block rounded-lg border border-slate-700 px-4 py-2 text-center text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300"
            >
              Internal tools
            </Link>
            <p className="mt-3 text-xs leading-5 text-slate-400">
              {lastLoadedAt
                ? `Last refreshed: ${lastLoadedAt}`
                : "Tasks load automatically on page open."}
            </p>
          </div>
        </div>

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Total tasks
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {isLoading ? "Loading" : tasks.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Active tasks
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {isLoading ? "Loading" : openCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
              Done
            </p>
            <p className="mt-3 text-2xl font-semibold text-white">
              {isLoading ? "Loading" : doneCount}
            </p>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-base font-semibold text-white">
                Automation
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Run internal automation using saved analysis JSON only.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleRunWorkflowAutomation()}
                disabled={isRunningWorkflowAutomation}
                className="w-fit rounded-lg border border-cyan-400/60 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:border-cyan-300 hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isRunningWorkflowAutomation ? "Running..." : "Run automation"}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-base font-semibold text-white">
            Create manual task
          </h2>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <label className="text-sm font-semibold text-slate-200 md:col-span-3">
              Title
              <input
                type="text"
                value={createForm.title}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    title: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Workflow
              <select
                value={createForm.demo_type}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    demo_type: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                {workflowOptions.map((workflow) => (
                  <option key={workflow.demoType} value={workflow.demoType}>
                    {workflow.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Status
              <select
                value={createForm.status}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    status: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Priority
              <select
                value={createForm.priority}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    priority: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Source record title
              <input
                type="text"
                value={createForm.source_record_title}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    source_record_title: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Due date
              <input
                type="date"
                value={createForm.due_date}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    due_date: event.target.value,
                  }))
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200 md:col-span-3">
              Notes
              <textarea
                value={createForm.notes}
                onChange={(event) =>
                  setCreateForm((form) => ({
                    ...form,
                    notes: event.target.value,
                  }))
                }
                rows={3}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void handleCreateTask()}
            disabled={savingTaskId === "new" || !createForm.title.trim()}
            className="mt-4 rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingTaskId === "new" ? "Creating..." : "Create task"}
          </button>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
          <h2 className="text-base font-semibold text-white">Filters</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <label className="text-sm font-semibold text-slate-200">
              Search
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Title, notes, source..."
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-400"
              />
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as TaskStatusFilter)
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="all">All statuses</option>
                {taskStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-200">
              Priority
              <select
                value={priorityFilter}
                onChange={(event) =>
                  setPriorityFilter(event.target.value as TaskPriorityFilter)
                }
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-cyan-400"
              >
                <option value="all">All priorities</option>
                {taskPriorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
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
                {workflowOptions.map((workflow) => (
                  <option key={workflow.key} value={workflow.key}>
                    {workflow.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        {actionMessage ? (
          <div
            className={
              actionMessage.kind === "success"
                ? "mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200"
                : "mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200"
            }
          >
            <p>{actionMessage.text}</p>
            {actionMessage.showActivityLogLink ? (
              <Link
                href="/internal/activity-log"
                className="mt-3 inline-flex rounded-lg border border-emerald-400/50 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-300 hover:text-white"
              >
                Open activity log
              </Link>
            ) : null}
          </div>
        ) : null}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/70 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">Tasks</h2>
              <p className="mt-1 text-sm text-slate-400">
                Generated and manual internal workflow tasks.
              </p>
            </div>
            <span className="w-fit rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold text-cyan-200">
              {filteredTasks.length} visible
            </span>
          </div>

          {isLoading ? (
            <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-300">
              Loading tasks...
            </p>
          ) : filteredTasks.length === 0 ? (
            <p className="mt-5 rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-sm text-slate-400">
              No tasks match the current filters.
            </p>
          ) : (
            <div className="mt-5 grid gap-4">
              {filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  editForm={editingTaskId === task.id ? editForm : null}
                  isEditing={editingTaskId === task.id}
                  isSaving={savingTaskId === task.id}
                  onCancelEdit={handleCancelEdit}
                  onDelete={() => void handleDeleteTask(task)}
                  onEdit={() => handleStartEdit(task)}
                  onEditFormChange={(updates) =>
                    setEditForm((current) =>
                      current
                        ? {
                            ...current,
                            ...updates,
                          }
                        : current,
                    )
                  }
                  onMarkDone={() => void handleMarkDone(task)}
                  onSaveEdit={() => void handleSaveEdit(task)}
                />
              ))}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
