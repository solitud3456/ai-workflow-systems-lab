import {
  areInternalToolsEnabled,
  buildDeletedRecordEventDetails,
  buildUpdatedRecordEventDetails,
  createDemoRecordEvent,
  deleteDemoRecord,
  getConfigErrorStatus,
  getErrorMessage,
  getRequestRecords,
  internalToolsDisabledResponse,
  isObjectRecord,
  jsonError,
  loadDemoRecords,
  mapDemoRecordUpdateBody,
  replaceDemoRecords,
  updateDemoRecord,
  type DemoRecordInsert,
} from "@/lib/demoRecordsApi";

const SUPPORT_DEMO_TYPE = "support_ticket";

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

function mapIncomingRecord(value: unknown): DemoRecordInsert | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const title =
    typeof value.title === "string" && value.title.trim()
      ? value.title.trim()
      : typeof value.customerName === "string" && value.customerName.trim()
        ? value.customerName.trim()
        : "";

  if (title.length < 3) {
    return null;
  }

  const status =
    typeof value.status === "string" && value.status.trim()
      ? value.status
      : "New";
  const source =
    getOptionalString(value.source) ?? getOptionalString(value.channel);
  const internalNotes =
    getOptionalString(value.internal_notes) ??
    getOptionalString(value.internalNotes);
  const analysisApproved =
    typeof value.analysis_approved === "boolean"
      ? value.analysis_approved
      : typeof value.analysisApproved === "boolean"
        ? value.analysisApproved
        : false;

  return {
    demo_type: SUPPORT_DEMO_TYPE,
    title,
    status,
    source,
    raw_input: getRawInput(value),
    internal_notes: internalNotes,
    analysis: value.analysis ?? null,
    analysis_approved: analysisApproved,
  };
}

export async function GET() {
  try {
    const { data, error } = await loadDemoRecords(SUPPORT_DEMO_TYPE);

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

export async function DELETE(request: Request) {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();

  if (!id) {
    return jsonError("A record id is required.", 400);
  }

  try {
    const { data, error } = await deleteDemoRecord(SUPPORT_DEMO_TYPE, id);

    if (error) {
      return jsonError(`Supabase delete failed: ${error.message}`, 500);
    }

    if (data) {
      await createDemoRecordEvent({
        demo_record_id: data.id,
        demo_type: SUPPORT_DEMO_TYPE,
        action: "deleted",
        title: data.title,
        details: buildDeletedRecordEventDetails(data),
      });
    }

    return Response.json({
      ok: true,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}

export async function PATCH(request: Request) {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  const id = new URL(request.url).searchParams.get("id")?.trim();

  if (!id) {
    return jsonError("A record id is required.", 400);
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const updates = mapDemoRecordUpdateBody(body);

  if (updates instanceof Response) {
    return updates;
  }

  try {
    const { data, error, previousData } = await updateDemoRecord(
      SUPPORT_DEMO_TYPE,
      id,
      updates,
    );

    if (error) {
      return jsonError(`Supabase update failed: ${error.message}`, 500);
    }

    if (!data) {
      return jsonError("Record not found for this workflow.", 404);
    }

    await createDemoRecordEvent({
      demo_record_id: data.id,
      demo_type: SUPPORT_DEMO_TYPE,
      action: "updated",
      title: data.title,
      details: buildUpdatedRecordEventDetails(updates, previousData, data),
    });

    return Response.json({
      ok: true,
      record: data,
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
    return jsonError(
      "Every support ticket must be a JSON object with a customer name or title of at least 3 characters.",
      400,
    );
  }

  const supportRecords = records as DemoRecordInsert[];

  try {
    const { deleteError, insertError } = await replaceDemoRecords(
      SUPPORT_DEMO_TYPE,
      supportRecords,
    );

    if (deleteError) {
      return jsonError(`Supabase replace failed: ${deleteError.message}`, 500);
    }

    if (insertError) {
      return jsonError(
        `Supabase replace failed after clearing old support records: ${insertError.message}`,
        500,
      );
    }

    return Response.json({
      ok: true,
      count: supportRecords.length,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
