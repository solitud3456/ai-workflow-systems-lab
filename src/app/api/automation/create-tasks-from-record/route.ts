import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  isObjectRecord,
  jsonError,
  loadDemoRecordById,
} from "@/lib/demoRecordsApi";
import {
  createTasksForDemoRecord,
  mapDemoRecordForTaskAutomation,
  type TaskAutomationResult,
} from "@/lib/taskAutomation";

type AutomationRequest = {
  recordId: string;
  demoType: string;
};

function normalizeRequest(body: unknown): AutomationRequest | Response {
  if (!isObjectRecord(body)) {
    return jsonError("Request body must be a JSON object.", 400);
  }

  if (typeof body.recordId !== "string" || !body.recordId.trim()) {
    return jsonError("recordId must be a non-empty string.", 400);
  }

  if (typeof body.demoType !== "string" || !body.demoType.trim()) {
    return jsonError("demoType must be a non-empty string.", 400);
  }

  return {
    recordId: body.recordId.trim(),
    demoType: body.demoType.trim(),
  };
}

function taskResponse(result: TaskAutomationResult) {
  return Response.json({
    ok: true,
    tasksCreated: result.tasksCreated,
    tasks: result.tasks,
    reason: result.reason,
    duplicatesSkipped: result.duplicatesSkipped,
    candidateTasks: result.candidateTasks,
  });
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
    const { data: record, error: recordError } = await loadDemoRecordById(
      payload.demoType,
      payload.recordId,
    );

    if (recordError) {
      return jsonError(`Supabase record load failed: ${recordError.message}`, 500);
    }

    if (!record) {
      return jsonError("Record not found for this workflow.", 404);
    }

    const taskRecord = mapDemoRecordForTaskAutomation(record);

    if (!taskRecord) {
      return jsonError("Record could not be mapped for task automation.", 500);
    }

    const result = await createTasksForDemoRecord(taskRecord, {
      automationMode: "single_record",
    });

    return taskResponse(result);
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
