import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  jsonError,
  loadDemoRecords,
} from "@/lib/demoRecordsApi";
import {
  mapDemoRecordForTaskAutomation,
  type DemoRecordForTaskAutomation,
} from "@/lib/taskAutomation";
import { createAutomationActivityEvent } from "@/lib/taskActivity";
import {
  runWorkflowAutomationForRecord,
  summarizeWorkflowAutomationResults,
  workflowAutomationDemoTypes,
  type WorkflowAutomationResult,
} from "@/lib/workflowAutomation";

function isTaskRecord(
  record: DemoRecordForTaskAutomation | null,
): record is DemoRecordForTaskAutomation {
  return Boolean(record);
}

export async function POST() {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  try {
    const recordsByDemoType = await Promise.all(
      workflowAutomationDemoTypes.map(async (demoType) => {
        const { data, error } = await loadDemoRecords(demoType);

        if (error) {
          throw new Error(
            `Supabase ${demoType} record load failed: ${error.message}`,
          );
        }

        return data ?? [];
      }),
    );
    const sourceRecords = recordsByDemoType.flat();
    const taskRecords = sourceRecords
      .map(mapDemoRecordForTaskAutomation)
      .filter(isTaskRecord);
    const results: WorkflowAutomationResult[] = [];

    for (const record of taskRecords) {
      results.push(await runWorkflowAutomationForRecord(record));
    }

    const summary = summarizeWorkflowAutomationResults(results);
    const responseBody = {
      ok: true,
      runType: "workflow_automation",
      ...summary,
      results,
    };

    await createAutomationActivityEvent({
      action: "workflow_automation_run",
      title: "Workflow automation run",
      details: responseBody,
    });

    return Response.json(responseBody);
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
