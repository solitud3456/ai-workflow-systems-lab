import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  jsonError,
} from "@/lib/demoRecordsApi";
import { createTasksForApprovedDemoRecords } from "@/lib/taskAutomation";

export async function POST() {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  try {
    const summary = await createTasksForApprovedDemoRecords({
      automationMode: "daily_task_generation",
      logActivity: true,
      activityAction: "automation_run",
      activityTitle: "Daily task generation",
      logWhenNoTasks: true,
      activityRunType: "daily_task_generation",
      includeResultsInActivity: true,
    });

    return Response.json({
      ok: true,
      runType: "daily_task_generation",
      processedRecords: summary.processedRecords,
      tasksCreated: summary.tasksCreated,
      skippedNoAnalysis: summary.skippedNoAnalysis,
      skippedNoActionFields: summary.skippedNoActionFields,
      duplicatesSkipped: summary.duplicatesSkipped,
      results: summary.results,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
