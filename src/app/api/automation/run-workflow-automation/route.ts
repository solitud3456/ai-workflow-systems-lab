import {
  areInternalToolsEnabled,
  getConfigErrorStatus,
  getErrorMessage,
  internalToolsDisabledResponse,
  isObjectRecord,
  jsonError,
  loadDemoRecords,
  updateDemoRecord,
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

type WorkflowAutomationResult = {
  recordId: string;
  demoType: string;
  title: string;
  statusBefore: string;
  statusAfter: string;
  statusUpdated: boolean;
  taskResult: TaskAutomationResult;
};

function parseMaybeJson(value: unknown) {
  if (typeof value !== "string") {
    return value ?? null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function hasStringItems(value: unknown) {
  return (
    Array.isArray(value) &&
    value.some((item) => typeof item === "string" && item.trim())
  );
}

function getCurrentStatus(record: unknown) {
  return isObjectRecord(record) && typeof record.status === "string"
    ? record.status
    : "New";
}

function isTaskRecord(
  record: DemoRecordForTaskAutomation | null,
): record is DemoRecordForTaskAutomation {
  return Boolean(record);
}

function getTriageStatus(
  record: DemoRecordForTaskAutomation,
  currentStatus: string,
) {
  const analysis = parseMaybeJson(record.analysis);

  if (!isObjectRecord(analysis)) {
    return null;
  }

  if (record.demo_type === "lead_follow_up") {
    const urgency = getString(analysis.urgency)?.toLowerCase();
    const nextAction = getString(analysis.nextAction);

    if (urgency === "high") {
      return "Follow-up";
    }

    if (nextAction && currentStatus === "New") {
      return "Needs review";
    }
  }

  if (record.demo_type === "recruitment_assistant") {
    const fitScore = getString(analysis.fitScore)?.toLowerCase();
    const nextAction = getString(analysis.nextAction);

    if (fitScore === "high") {
      return "Follow-up";
    }

    if (fitScore === "medium" && currentStatus === "New") {
      return "Needs review";
    }

    if (nextAction && currentStatus === "New") {
      return "Needs review";
    }
  }

  if (record.demo_type === "document_intake") {
    const nextAction = getString(analysis.nextAction);

    if (hasStringItems(analysis.actionItems)) {
      return "Follow-up";
    }

    if (hasStringItems(analysis.missingInformation)) {
      return "Needs review";
    }

    if (nextAction && currentStatus === "New") {
      return "Needs review";
    }
  }

  return null;
}

function summarizeResults(results: WorkflowAutomationResult[]) {
  return {
    recordsScanned: results.length,
    statusesUpdated: results.filter((result) => result.statusUpdated).length,
    tasksCreated: results.reduce(
      (total, result) => total + result.taskResult.tasksCreated,
      0,
    ),
    duplicatesSkipped: results.reduce(
      (total, result) => total + result.taskResult.duplicatesSkipped,
      0,
    ),
    skippedNoAnalysis: results.filter(
      (result) => result.taskResult.reason === "no_analysis",
    ).length,
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
    const sourceRecords = recordsByDemoType.flat();
    const taskRecords = sourceRecords
      .map(mapDemoRecordForTaskAutomation)
      .filter(isTaskRecord);
    const results: WorkflowAutomationResult[] = [];

    for (const record of taskRecords) {
      const sourceRecord = sourceRecords.find(
        (item) => isObjectRecord(item) && item.id === record.id,
      );
      const statusBefore = getCurrentStatus(sourceRecord);
      const nextStatus = getTriageStatus(record, statusBefore);
      let statusAfter = statusBefore;
      let statusUpdated = false;

      if (nextStatus && nextStatus !== statusBefore) {
        const { data, error } = await updateDemoRecord(
          record.demo_type,
          record.id,
          {
            status: nextStatus,
          },
        );

        if (error) {
          throw new Error(
            `Supabase ${record.demo_type} status update failed: ${error.message}`,
          );
        }

        if (data) {
          statusAfter = data.status;
          statusUpdated = true;
        }
      }

      const taskResult = await createTasksForDemoRecord(record, {
        automationMode: "workflow_automation",
      });

      results.push({
        recordId: record.id,
        demoType: record.demo_type,
        title: record.title,
        statusBefore,
        statusAfter,
        statusUpdated,
        taskResult,
      });
    }

    const summary = summarizeResults(results);
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
