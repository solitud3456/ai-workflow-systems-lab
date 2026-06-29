import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  jsonError,
} from "@/lib/demoRecordsApi";
import { runAutomationEngine } from "@/lib/automationEngine";

export async function POST() {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  try {
    const result = await runAutomationEngine();

    return Response.json(result);
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
