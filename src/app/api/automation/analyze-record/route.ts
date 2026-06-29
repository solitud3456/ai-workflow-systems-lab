import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  isObjectRecord,
  jsonError,
  loadDemoRecordById,
} from "@/lib/demoRecordsApi";
import { autoAnalyzeDemoRecord } from "@/lib/recordAutoAnalysis";
import {
  isSupportedAnalysisDemoType,
  mapDemoRecordForAnalysis,
} from "@/lib/ruleBasedAnalysis";

function normalizeRequest(body: unknown) {
  if (!isObjectRecord(body)) {
    return jsonError("Request body must be a JSON object.", 400);
  }

  if (typeof body.recordId !== "string" || !body.recordId.trim()) {
    return jsonError("recordId must be a non-empty string.", 400);
  }

  if (typeof body.demoType !== "string" || !body.demoType.trim()) {
    return jsonError("demoType must be a non-empty string.", 400);
  }

  if (!isSupportedAnalysisDemoType(body.demoType)) {
    return jsonError("demoType is not supported.", 400);
  }

  return {
    recordId: body.recordId.trim(),
    demoType: body.demoType.trim(),
  };
}

export async function POST(request: Request) {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Request body must be valid JSON.", 400);
  }

  const payload = normalizeRequest(body);

  if (payload instanceof Response) {
    return payload;
  }

  try {
    const { data: record, error } = await loadDemoRecordById(
      payload.demoType,
      payload.recordId,
    );

    if (error) {
      return jsonError(`Supabase record load failed: ${error.message}`, 500);
    }

    const analysisRecord = mapDemoRecordForAnalysis(record);

    if (!analysisRecord) {
      return jsonError("Record not found for this workflow.", 404);
    }

    const result = await autoAnalyzeDemoRecord(analysisRecord);

    return Response.json({
      ok: true,
      record: result.record,
      analysis: result.analysis,
      analysisApproved: result.analysisApproved,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
