import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  jsonError,
} from "@/lib/demoRecordsApi";
import { runCompanyDaySimulation } from "@/lib/companyDaySimulation";

export async function POST() {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  try {
    const result = await runCompanyDaySimulation();

    return Response.json(result);
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
