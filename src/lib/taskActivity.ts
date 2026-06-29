import {
  createDemoRecordEvent,
  isObjectRecord,
} from "@/lib/demoRecordsApi";
import type { DemoTaskUpdate } from "@/lib/demoTasksApi";

type TaskActivityAction =
  | "task_created"
  | "task_updated"
  | "task_completed"
  | "task_deleted"
  | "bulk_tasks_generated"
  | "automation_run";

type TaskEventRecord = {
  id: string | null;
  demo_record_id: string | null;
  demo_type: string;
  title: string | null;
  status: string | null;
  priority: string | null;
  source_record_title: string | null;
  notes: string | null;
  due_date: string | null;
};

function getString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

export function normalizeTaskEventRecord(
  value: unknown,
  fallback: Partial<TaskEventRecord> = {},
): TaskEventRecord {
  const task = isObjectRecord(value) ? value : {};

  return {
    id: getString(task.id) ?? fallback.id ?? null,
    demo_record_id:
      getString(task.demo_record_id) ?? fallback.demo_record_id ?? null,
    demo_type: getString(task.demo_type) ?? fallback.demo_type ?? "task",
    title: getString(task.title) ?? fallback.title ?? null,
    status: getString(task.status) ?? fallback.status ?? null,
    priority: getString(task.priority) ?? fallback.priority ?? null,
    source_record_title:
      getString(task.source_record_title) ??
      fallback.source_record_title ??
      null,
    notes: getString(task.notes) ?? fallback.notes ?? null,
    due_date: getString(task.due_date) ?? fallback.due_date ?? null,
  };
}

export function buildTaskEventDetails(
  task: unknown,
  extraDetails: Record<string, unknown> = {},
) {
  const normalizedTask = normalizeTaskEventRecord(task);

  return {
    task_id: normalizedTask.id,
    status: normalizedTask.status,
    priority: normalizedTask.priority,
    source_record_title: normalizedTask.source_record_title,
    due_date: normalizedTask.due_date,
    ...extraDetails,
  };
}

export function buildUpdatedTaskEventDetails(
  updates: DemoTaskUpdate,
  previousTask: unknown,
  updatedTask: unknown,
) {
  const previous = normalizeTaskEventRecord(previousTask);
  const updated = normalizeTaskEventRecord(updatedTask, previous);
  const fields = Object.entries(updates).reduce<
    Record<string, { from: unknown; to: unknown }>
  >((details, [field, value]) => {
    const key = field as keyof DemoTaskUpdate;

    details[field] = {
      from: previous[key as keyof TaskEventRecord] ?? null,
      to: updated[key as keyof TaskEventRecord] ?? value,
    };

    return details;
  }, {});

  return {
    task_id: updated.id,
    fields,
  };
}

export async function createTaskActivityEvent({
  action,
  task,
  details,
}: {
  action: TaskActivityAction;
  task: unknown;
  details: Record<string, unknown>;
}) {
  const normalizedTask = normalizeTaskEventRecord(task);

  return createDemoRecordEvent({
    demo_record_id: normalizedTask.demo_record_id,
    demo_type: normalizedTask.demo_type,
    action,
    title: normalizedTask.title,
    details,
  });
}

export async function createAutomationActivityEvent({
  action = "bulk_tasks_generated",
  title,
  details,
}: {
  action?: Extract<
    TaskActivityAction,
    "bulk_tasks_generated" | "automation_run"
  >;
  title: string;
  details: Record<string, unknown>;
}) {
  return createDemoRecordEvent({
    demo_record_id: null,
    demo_type: "task",
    action,
    title,
    details,
  });
}
