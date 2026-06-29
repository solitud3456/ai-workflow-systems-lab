import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  jsonError,
} from "@/lib/demoRecordsApi";
import {
  createWorkflowIntakeRecord,
  mapWorkflowIntakeBody,
} from "@/lib/workflowIntake";

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

  const payload = mapWorkflowIntakeBody(body);

  if (payload instanceof Response) {
    return payload;
  }

  try {
    const result = await createWorkflowIntakeRecord(payload);

    return Response.json(result);
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
