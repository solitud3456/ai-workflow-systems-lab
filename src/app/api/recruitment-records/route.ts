import {
  getConfigErrorStatus,
  getErrorMessage,
  getRequestRecords,
  jsonError,
  loadDemoRecords,
  mapIncomingDemoRecord,
  replaceDemoRecords,
  type DemoRecordInsert,
} from "@/lib/demoRecordsApi";

const RECRUITMENT_DEMO_TYPE = "recruitment_assistant";

function mapIncomingRecord(
  value: unknown,
  index: number,
): DemoRecordInsert | null {
  return mapIncomingDemoRecord(value, index, {
    demoType: RECRUITMENT_DEMO_TYPE,
    fallbackTitle: `Candidate record ${index + 1}`,
  });
}

export async function GET() {
  try {
    const { data, error } = await loadDemoRecords(RECRUITMENT_DEMO_TYPE);

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
    return jsonError("Every candidate record must be a JSON object.", 400);
  }

  const recruitmentRecords = records as DemoRecordInsert[];

  try {
    const { deleteError, insertError } = await replaceDemoRecords(
      RECRUITMENT_DEMO_TYPE,
      recruitmentRecords,
    );

    if (deleteError) {
      return jsonError(`Supabase replace failed: ${deleteError.message}`, 500);
    }

    if (insertError) {
      return jsonError(
        `Supabase replace failed after clearing old recruitment records: ${insertError.message}`,
        500,
      );
    }

    return Response.json({
      ok: true,
      count: recruitmentRecords.length,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
