import {
  getSupabaseAdminClient,
  SupabaseAdminConfigError,
} from "@/lib/supabaseAdmin";

const DOCUMENT_DEMO_TYPE = "document_intake";

type DemoRecordInsert = {
  demo_type: typeof DOCUMENT_DEMO_TYPE;
  title: string;
  status: string;
  source: string | null;
  raw_input: string | null;
  internal_notes: string | null;
  analysis: unknown;
  analysis_approved: boolean;
};

function isObjectRecord(value: unknown): value is Record<string, unknown> {
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

function getRequestRecords(body: unknown): unknown[] | null {
  if (Array.isArray(body)) {
    return body;
  }

  if (isObjectRecord(body) && Array.isArray(body.records)) {
    return body.records;
  }

  return null;
}

function mapIncomingRecord(
  value: unknown,
  index: number,
): DemoRecordInsert | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  return {
    demo_type: DOCUMENT_DEMO_TYPE,
    title:
      typeof value.title === "string" && value.title.trim()
        ? value.title
        : `Document record ${index + 1}`,
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

function jsonError(message: string, status: number) {
  return Response.json({ ok: false, error: message }, { status });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (isObjectRecord(error) && typeof error.message === "string") {
    return error.message;
  }

  return "Unknown server error.";
}

function getConfigErrorStatus(error: unknown) {
  return error instanceof SupabaseAdminConfigError ? 503 : 500;
}

export async function GET() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("demo_records")
      .select(
        "id, demo_type, title, status, source, raw_input, internal_notes, analysis, analysis_approved, created_at, updated_at",
      )
      .eq("demo_type", DOCUMENT_DEMO_TYPE)
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(`Supabase load failed: ${error.message}`, 500);
    }

    return Response.json({
      ok: true,
      records: data ?? [],
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const requestRecords = getRequestRecords(body);

  if (!requestRecords) {
    return jsonError(
      'Request body must be an array of records or an object with a "records" array.',
      400,
    );
  }

  const records = requestRecords.map(mapIncomingRecord);

  if (records.some((record) => record === null)) {
    return jsonError("Every document record must be a JSON object.", 400);
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { error: deleteError } = await supabase
      .from("demo_records")
      .delete()
      .eq("demo_type", DOCUMENT_DEMO_TYPE);

    if (deleteError) {
      return jsonError(`Supabase replace failed: ${deleteError.message}`, 500);
    }

    const documentRecords = records as DemoRecordInsert[];

    if (documentRecords.length > 0) {
      const { error: insertError } = await supabase
        .from("demo_records")
        .insert(documentRecords);

      if (insertError) {
        return jsonError(
          `Supabase replace failed after clearing old document records: ${insertError.message}`,
          500,
        );
      }
    }

    return Response.json({
      ok: true,
      count: documentRecords.length,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
