import {
  getSupabaseAdminClient,
  SupabaseAdminConfigError,
} from "@/lib/supabaseAdmin";

const DEMO_RECORD_SELECT =
  "id, demo_type, title, status, source, raw_input, internal_notes, analysis, analysis_approved, created_at, updated_at";

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
    .eq("id", id);
}
