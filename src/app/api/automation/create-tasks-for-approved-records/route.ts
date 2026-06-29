import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  jsonError,
  loadDemoRecords,
} from "@/lib/demoRecordsApi";
import {
  createTasksForDemoRecord,
  mapDemoRecordForTaskAutomation,
  type DemoRecordForTaskAutomation,
  type TaskAutomationResult,
} from "@/lib/taskAutomation";
import { createAutomationActivityEvent } from "@/lib/taskActivity";

const demoTypes = [
  "lead_follow_up",
  "recruitment_assistant",
  "document_intake",
] as const;

function isTaskRecord(
  record: DemoRecordForTaskAutomation | null,
): record is DemoRecordForTaskAutomation {
  return Boolean(record);
}

function summarizeResults(results: TaskAutomationResult[]) {
  return {
    tasksCreated: results.reduce(
      (total, result) => total + result.tasksCreated,
      0,
    ),
    skippedNoAnalysis: results.filter(
      (result) => result.reason === "no_analysis",
    ).length,
    skippedNoActionFields: results.filter(
      (result) => result.reason === "no_action_fields",
    ).length,
    duplicatesSkipped: results.reduce(
      (total, result) => total + result.duplicatesSkipped,
      0,
    ),
  };
}

export async function POST() {
  if (!areInternalToolsEnabled()) {
    return internalToolsDisabledResponse();
  }

  try {
    const recordsByDemoType = await Promise.all(
      demoTypes.map(async (demoType) => {
        const { data, error } = await loadDemoRecords(demoType);

        if (error) {
          throw new Error(
            `Supabase ${demoType} record load failed: ${error.message}`,
          );
        }

        return data ?? [];
      }),
    );
    const approvedRecords = recordsByDemoType
      .flat()
      .map(mapDemoRecordForTaskAutomation)
      .filter(isTaskRecord)
      .filter((record) => record.analysis_approved);
    const results: TaskAutomationResult[] = [];

    for (const record of approvedRecords) {
      results.push(
        await createTasksForDemoRecord(record, {
          automationMode: "approved_records",
        }),
      );
    }

    const summary = summarizeResults(results);

    if (summary.tasksCreated > 0) {
      await createAutomationActivityEvent({
        title: "Generated tasks for approved records",
        details: {
          processedRecords: approvedRecords.length,
          ...summary,
          createdRecords: results
            .filter((result) => result.tasksCreated > 0)
            .map((result) => ({
              demo_record_id: result.recordId,
              demo_type: result.demoType,
              title: result.recordTitle,
              tasksCreated: result.tasksCreated,
            })),
        },
      });
    }

    return Response.json({
      ok: true,
      processedRecords: approvedRecords.length,
      ...summary,
      results,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
