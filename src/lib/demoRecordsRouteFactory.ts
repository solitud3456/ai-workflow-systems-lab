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

type DemoRecordsRouteOptions = {
  demoType: string;
  invalidRecordMessage: string;
};

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

function mapIncomingRecord(
  value: unknown,
  demoType: string,
): DemoRecordInsert | null {
  if (!isObjectRecord(value)) {
    return null;
  }

  const title =
    typeof value.title === "string" && value.title.trim()
      ? value.title.trim()
      : "";

  if (title.length < 3) {
    return null;
  }

  return {
    demo_type: demoType,
    title,
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

export function createDemoRecordsRouteHandlers({
  demoType,
  invalidRecordMessage,
}: DemoRecordsRouteOptions) {
  async function GET() {
    try {
      const { data, error } = await loadDemoRecords(demoType);

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

  async function DELETE(request: Request) {
    if (!areInternalToolsEnabled()) {
      return internalToolsDisabledResponse();
    }

    const id = new URL(request.url).searchParams.get("id")?.trim();

    if (!id) {
      return jsonError("A record id is required.", 400);
    }

    try {
      const { data, error } = await deleteDemoRecord(demoType, id);

      if (error) {
        return jsonError(`Supabase delete failed: ${error.message}`, 500);
      }

      if (data) {
        await createDemoRecordEvent({
          demo_record_id: data.id,
          demo_type: demoType,
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

  async function PATCH(request: Request) {
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
        demoType,
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
        demo_type: demoType,
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

  async function POST(request: Request) {
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

    const records = requestRecords.map((record) =>
      mapIncomingRecord(record, demoType),
    );

    if (records.some((record) => record === null)) {
      return jsonError(invalidRecordMessage, 400);
    }

    const demoRecords = records as DemoRecordInsert[];

    try {
      const { deleteError, insertError } = await replaceDemoRecords(
        demoType,
        demoRecords,
      );

      if (deleteError) {
        return jsonError(`Supabase replace failed: ${deleteError.message}`, 500);
      }

      if (insertError) {
        return jsonError(
          `Supabase replace failed after clearing old records: ${insertError.message}`,
          500,
        );
      }

      return Response.json({
        ok: true,
        count: demoRecords.length,
      });
    } catch (error) {
      return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
    }
  }

  return {
    GET,
    DELETE,
    PATCH,
    POST,
  };
}
