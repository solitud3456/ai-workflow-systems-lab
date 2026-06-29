import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { isObjectRecord, jsonError } from "@/lib/demoRecordsApi";

const DEMO_TASK_SELECT =
  "id, demo_record_id, demo_type, title, status, priority, source_record_title, notes, due_date, created_at, updated_at";

export type DemoTaskInsert = {
  demo_record_id: string | null;
  demo_type: string;
  title: string;
  status: string;
  priority: string;
  source_record_title: string | null;
  notes: string | null;
  due_date: string | null;
};

export type DemoTaskUpdate = {
  title?: string;
  status?: string;
  priority?: string;
  notes?: string | null;
  due_date?: string | null;
};

const SAFE_TASK_UPDATE_FIELDS = [
  "title",
  "status",
  "priority",
  "notes",
  "due_date",
] as const;

function getOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getRequiredString(
  value: unknown,
  fieldName: string,
): string | Response {
  if (typeof value !== "string" || !value.trim()) {
    return jsonError(`${fieldName} must be a non-empty string.`, 400);
  }

  return value.trim();
}

function getNullableStringUpdate(
  value: unknown,
  fieldName: string,
): string | null | Response {
  if (typeof value !== "string" && value !== null) {
    return jsonError(`${fieldName} must be a string or null.`, 400);
  }

  return value;
}

export function mapDemoTaskCreateBody(
  body: unknown,
): DemoTaskInsert | Response {
  if (!isObjectRecord(body)) {
    return jsonError("Request body must be a JSON object.", 400);
  }

  const title = getRequiredString(body.title, "title");

  if (title instanceof Response) {
    return title;
  }

  const demoType = getRequiredString(body.demo_type, "demo_type");

  if (demoType instanceof Response) {
    return demoType;
  }

  if (
    "due_date" in body &&
    typeof body.due_date !== "string" &&
    body.due_date !== null
  ) {
    return jsonError("due_date must be a string or null.", 400);
  }

  return {
    demo_record_id: getOptionalString(body.demo_record_id),
    demo_type: demoType,
    title,
    status:
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : "Open",
    priority:
      typeof body.priority === "string" && body.priority.trim()
        ? body.priority.trim()
        : "Normal",
    source_record_title: getOptionalString(body.source_record_title),
    notes: getOptionalString(body.notes),
    due_date: getOptionalString(body.due_date),
  };
}

export function mapDemoTaskUpdateBody(
  body: unknown,
): DemoTaskUpdate | Response {
  if (!isObjectRecord(body)) {
    return jsonError("Request body must be a JSON object.", 400);
  }

  const unsafeFields = Object.keys(body).filter(
    (field) =>
      !SAFE_TASK_UPDATE_FIELDS.includes(
        field as (typeof SAFE_TASK_UPDATE_FIELDS)[number],
      ),
  );

  if (unsafeFields.length > 0) {
    return jsonError(
      `Unsupported update field: ${unsafeFields.join(", ")}`,
      400,
    );
  }

  const updates: DemoTaskUpdate = {};

  if ("title" in body) {
    const title = getRequiredString(body.title, "title");

    if (title instanceof Response) {
      return title;
    }

    updates.title = title;
  }

  if ("status" in body) {
    const status = getRequiredString(body.status, "status");

    if (status instanceof Response) {
      return status;
    }

    updates.status = status;
  }

  if ("priority" in body) {
    const priority = getRequiredString(body.priority, "priority");

    if (priority instanceof Response) {
      return priority;
    }

    updates.priority = priority;
  }

  if ("notes" in body) {
    const notes = getNullableStringUpdate(body.notes, "notes");

    if (notes instanceof Response) {
      return notes;
    }

    updates.notes = notes;
  }

  if ("due_date" in body) {
    const dueDate = getNullableStringUpdate(body.due_date, "due_date");

    if (dueDate instanceof Response) {
      return dueDate;
    }

    updates.due_date = dueDate;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("At least one supported update field is required.", 400);
  }

  return updates;
}

export async function loadDemoTasks() {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_tasks")
    .select(DEMO_TASK_SELECT)
    .order("created_at", { ascending: false });
}

export async function loadDemoTasksForRecord(recordId: string) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_tasks")
    .select(DEMO_TASK_SELECT)
    .eq("demo_record_id", recordId);
}

export async function loadDemoTaskById(id: string) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_tasks")
    .select(DEMO_TASK_SELECT)
    .eq("id", id)
    .maybeSingle();
}

export async function createDemoTask(task: DemoTaskInsert) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_tasks")
    .insert(task)
    .select(DEMO_TASK_SELECT)
    .single();
}

export async function createDemoTasks(tasks: DemoTaskInsert[]) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_tasks")
    .insert(tasks)
    .select(DEMO_TASK_SELECT);
}

export async function updateDemoTask(id: string, updates: DemoTaskUpdate) {
  const supabase = getSupabaseAdminClient();
  const { data: previousData, error: loadError } = await loadDemoTaskById(id);

  if (loadError) {
    return {
      data: null,
      error: loadError,
      previousData: null,
    };
  }

  if (!previousData) {
    return {
      data: null,
      error: null,
      previousData: null,
    };
  }

  const { data, error } = await supabase
    .from("demo_tasks")
    .update(updates)
    .eq("id", id)
    .select(DEMO_TASK_SELECT)
    .maybeSingle();

  return {
    data,
    error,
    previousData,
  };
}

export async function deleteDemoTask(id: string) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_tasks")
    .delete()
    .eq("id", id)
    .select(DEMO_TASK_SELECT)
    .maybeSingle();
}
