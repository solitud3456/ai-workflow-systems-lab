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
  jsonError,
  loadDemoRecords,
  mapDemoRecordUpdateBody,
  mapIncomingDemoRecord,
  replaceDemoRecords,
  updateDemoRecord,
  type DemoRecordInsert,
} from "@/lib/demoRecordsApi";

const DOCUMENT_DEMO_TYPE = "document_intake";

function mapIncomingRecord(
  value: unknown,
  index: number,
): DemoRecordInsert | null {
  return mapIncomingDemoRecord(value, index, {
    demoType: DOCUMENT_DEMO_TYPE,
    fallbackTitle: `Document record ${index + 1}`,
  });
}

export async function GET() {
  try {
    const { data, error } = await loadDemoRecords(DOCUMENT_DEMO_TYPE);

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
    const { data, error } = await deleteDemoRecord(DOCUMENT_DEMO_TYPE, id);

    if (error) {
      return jsonError(`Supabase delete failed: ${error.message}`, 500);
    }

    if (data) {
      await createDemoRecordEvent({
        demo_record_id: data.id,
        demo_type: DOCUMENT_DEMO_TYPE,
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
      DOCUMENT_DEMO_TYPE,
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
      demo_type: DOCUMENT_DEMO_TYPE,
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
    return jsonError("Every document record must be a JSON object.", 400);
  }

  const documentRecords = records as DemoRecordInsert[];

  try {
    const { deleteError, insertError } = await replaceDemoRecords(
      DOCUMENT_DEMO_TYPE,
      documentRecords,
    );

    if (deleteError) {
      return jsonError(`Supabase replace failed: ${deleteError.message}`, 500);
    }

    if (insertError) {
      return jsonError(
        `Supabase replace failed after clearing old document records: ${insertError.message}`,
        500,
      );
    }

    return Response.json({
      ok: true,
      count: documentRecords.length,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
