import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  jsonError,
  loadDemoRecordEvents,
} from "@/lib/demoRecordsApi";

export async function GET() {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  try {
    const { data, error } = await loadDemoRecordEvents();

    if (error) {
      return jsonError(`Supabase event load failed: ${error.message}`, 500);
    }

    return Response.json({
      ok: true,
      events: data ?? [],
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
