import {
  getSupabaseAdminClient,
  SupabaseAdminConfigError,
} from "@/lib/supabaseAdmin";

const DEMO_RECORD_SELECT =
  "id, demo_type, title, status, source, raw_input, internal_notes, analysis, analysis_approved, created_at, updated_at";
const DEMO_RECORD_EVENT_SELECT =
  "id, demo_record_id, demo_type, action, title, details, created_at";

export type DemoRecordInsert = {
  demo_type: string;
  title: string;
  status: string;
  source: string | null;
  raw_input: string | null;
  internal_notes: string | null;
  analysis: unknown;
  analysis_approved: boolean;
};

export type DemoRecordUpdate = {
  title?: string;
  status?: string;
  source?: string | null;
  analysis_approved?: boolean;
  internal_notes?: string | null;
};

export type DemoRecordAnalysisUpdate = {
  analysis: unknown;
  analysis_approved: boolean;
};

type DemoRecordSnapshot = {
  id: string;
  demo_type: string;
  title: string;
  status: string;
  source: string | null;
  raw_input: string | null;
  internal_notes: string | null;
  analysis: unknown;
  analysis_approved: boolean;
};

type DemoRecordEventInsert = {
  demo_record_id: string | null;
  demo_type: string;
  action: string;
  title: string | null;
  details: unknown;
};

const SAFE_UPDATE_FIELDS = [
  "title",
  "status",
  "source",
  "analysis_approved",
  "internal_notes",
] as const;

export function isObjectRecord(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getRawInput(value: Record<string, unknown>): string | null {
  if (typeof value.raw_input === "string") {
    return value.raw_input;
  }

  if (value.raw_input === null) {
    return null;
  }

  return JSON.stringify(value);
}

export function getRequestRecords(body: unknown): unknown[] | null {
  if (Array.isArray(body)) {
    return body;
  }

  if (isObjectRecord(body) && Array.isArray(body.records)) {
    return body.records;
  }

  return null;
}

export function mapIncomingDemoRecord(
  value: unknown,
  index: number,
  options: {
    demoType: string;
    fallbackTitle: string;
  },
): DemoRecordInsert | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  return {
    demo_type: options.demoType,
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title
        : options.fallbackTitle,
    status:
      typeof value.status === "string" && value.status.trim()
        ? value.status
        : "New",
    source: getOptionalString(value.source),
    raw_input: getRawInput(value),
    internal_notes: getOptionalString(value.internal_notes),
    analysis: value.analysis ?? null,
    analysis_approved:
      typeof value.analysis_approved === "boolean"
        ? value.analysis_approved
        : false,
  };
}

export function jsonError(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}

export function mapDemoRecordUpdateBody(
  body: unknown,
): DemoRecordUpdate | Response {
  if (!isObjectRecord(body)) {
    return jsonError("Request body must be a JSON object.", 400);
  }

  const unsafeFields = Object.keys(body).filter(
    (field) =>
      !SAFE_UPDATE_FIELDS.includes(field as (typeof SAFE_UPDATE_FIELDS)[number]),
  );

  if (unsafeFields.length > 0) {
    return jsonError(
      `Unsupported update field: ${unsafeFields.join(", ")}`,
      400,
    );
  }

  const updates: DemoRecordUpdate = {};

  if ("title" in body) {
    if (typeof body.title !== "string") {
      return jsonError("title must be a string.", 400);
    }

    updates.title = body.title;
  }

  if ("status" in body) {
    if (typeof body.status !== "string") {
      return jsonError("status must be a string.", 400);
    }

    updates.status = body.status;
  }

  if ("source" in body) {
    if (typeof body.source !== "string" && body.source !== null) {
      return jsonError("source must be a string or null.", 400);
    }

    updates.source = body.source;
  }

  if ("analysis_approved" in body) {
    if (typeof body.analysis_approved !== "boolean") {
      return jsonError("analysis_approved must be a boolean.", 400);
    }

    updates.analysis_approved = body.analysis_approved;
  }

  if ("internal_notes" in body) {
    if (typeof body.internal_notes !== "string" && body.internal_notes !== null) {
      return jsonError("internal_notes must be a string or null.", 400);
    }

    updates.internal_notes = body.internal_notes;
  }

  if (Object.keys(updates).length === 0) {
    return jsonError("At least one supported update field is required.", 400);
  }

  return updates;
}

export function internalToolsDisabledResponse() {
  return jsonError("Internal tools are disabled.", 403);
}

export function areInternalToolsEnabled() {
  return process.env.INTERNAL_TOOLS_ENABLED === "true";
}

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isObjectRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown server error.";
}

export function getConfigErrorStatus(error: unknown) {
  return error instanceof SupabaseAdminConfigError ? 503 : 500;
}

export async function loadDemoRecords(demoType: string) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_records")
    .select(DEMO_RECORD_SELECT)
    .eq("demo_type", demoType)
    .order("created_at", { ascending: false });
}

export async function loadDemoRecordById(demoType: string, id: string) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_records")
    .select(DEMO_RECORD_SELECT)
    .eq("demo_type", demoType)
    .eq("id", id)
    .maybeSingle();
}

export async function insertDemoRecord(record: DemoRecordInsert) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_records")
    .insert(record)
    .select(DEMO_RECORD_SELECT)
    .single();
}

export async function replaceDemoRecords(
  demoType: string,
  records: DemoRecordInsert[],
) {
  const supabase = getSupabaseAdminClient();
  const { error: deleteError } = await supabase
    .from("demo_records")
    .delete()
    .eq("demo_type", demoType);

  if (deleteError) {
    return {
      deleteError,
      insertError: null,
    };
  }

  if (records.length === 0) {
    return {
      deleteError: null,
      insertError: null,
    };
  }

  const { error: insertError } = await supabase
    .from("demo_records")
    .insert(records);

  return {
    deleteError: null,
    insertError,
  };
}

export async function deleteDemoRecord(demoType: string, id: string) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_records")
    .delete()
    .eq("demo_type", demoType)
    .eq("id", id)
    .select(DEMO_RECORD_SELECT)
    .maybeSingle();
}

export async function updateDemoRecord(
  demoType: string,
  id: string,
  updates: DemoRecordUpdate,
) {
  const supabase = getSupabaseAdminClient();
  const { data: previousData, error: loadError } = await supabase
    .from("demo_records")
    .select(DEMO_RECORD_SELECT)
    .eq("demo_type", demoType)
    .eq("id", id)
    .maybeSingle();

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
    .from("demo_records")
    .update(updates)
    .eq("demo_type", demoType)
    .eq("id", id)
    .select(DEMO_RECORD_SELECT)
    .maybeSingle();

  return {
    data,
    error,
    previousData,
  };
}

export async function updateDemoRecordAnalysis(
  demoType: string,
  id: string,
  updates: DemoRecordAnalysisUpdate,
) {
  const supabase = getSupabaseAdminClient();
  const { data: previousData, error: loadError } = await supabase
    .from("demo_records")
    .select(DEMO_RECORD_SELECT)
    .eq("demo_type", demoType)
    .eq("id", id)
    .maybeSingle();

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
    .from("demo_records")
    .update(updates)
    .eq("demo_type", demoType)
    .eq("id", id)
    .select(DEMO_RECORD_SELECT)
    .maybeSingle();

  return {
    data,
    error,
    previousData,
  };
}

export function buildUpdatedRecordEventDetails(
  updates: DemoRecordUpdate,
  previousRecord: DemoRecordSnapshot | null,
  updatedRecord: DemoRecordSnapshot | null,
) {
  return Object.entries(updates).reduce<Record<string, { from: unknown; to: unknown }>>(
    (details, [field, value]) => {
      details[field] = {
        from: previousRecord?.[field as keyof DemoRecordSnapshot] ?? null,
        to: updatedRecord?.[field as keyof DemoRecordSnapshot] ?? value,
      };

      return details;
    },
    {},
  );
}

export function buildDeletedRecordEventDetails(
  record: DemoRecordSnapshot,
) {
  return {
    title: record.title,
    status: record.status,
    source: record.source,
  };
}

export async function createDemoRecordEvent(event: DemoRecordEventInsert) {
  const supabase = getSupabaseAdminClient();

  return supabase.from("demo_record_events").insert(event);
}

export async function loadDemoRecordEvents(limit = 100) {
  const supabase = getSupabaseAdminClient();

  return supabase
    .from("demo_record_events")
    .select(DEMO_RECORD_EVENT_SELECT)
    .order("created_at", { ascending: false })
    .limit(limit);
}
