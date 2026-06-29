import {
  isObjectRecord,
  loadDemoRecords,
} from "@/lib/demoRecordsApi";
import {
  loadDemoTasks,
  updateDemoTask,
  type DemoTaskUpdate,
} from "@/lib/demoTasksApi";
import { autoAnalyzeDemoRecord } from "@/lib/recordAutoAnalysis";
import {
  hasSavedAnalysis,
  mapDemoRecordForAnalysis,
} from "@/lib/ruleBasedAnalysis";
import {
  mapDemoRecordForTaskAutomation,
  type DemoRecordForTaskAutomation,
} from "@/lib/taskAutomation";
import {
  buildUpdatedTaskEventDetails,
  createAutomationActivityEvent,
  createTaskActivityEvent,
  normalizeTaskEventRecord,
} from "@/lib/taskActivity";
import {
  runWorkflowAutomationForRecord,
  summarizeWorkflowAutomationResults,
  workflowAutomationDemoTypes,
  type WorkflowAutomationResult,
} from "@/lib/workflowAutomation";

export type AutomationEngineRunResult = {
  ok: true;
  runType: "automation_engine";
  recordsScanned: number;
  recordsAutoAnalyzed: number;
  recordsUpdated: number;
  tasksCreated: number;
  tasksUpdated: number;
  duplicatesSkipped: number;
  results: WorkflowAutomationResult[];
};

function isTaskRecord(
  record: DemoRecordForTaskAutomation | null,
): record is DemoRecordForTaskAutomation {
  return Boolean(record);
}

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function loadAllWorkflowRecords() {
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

  return recordsByDemoType.flat();
}

async function prepareRecordForAutomation(record: unknown) {
  const analysisRecord = mapDemoRecordForAnalysis(record);

  if (!analysisRecord) {
    return {
      record,
      autoAnalyzed: false,
    };
  }

  if (hasSavedAnalysis(analysisRecord)) {
    return {
      record,
      autoAnalyzed: false,
    };
  }

  const analysisResult = await autoAnalyzeDemoRecord(analysisRecord);

  return {
    record: analysisResult.record,
    autoAnalyzed: true,
  };
}

async function triageTasks() {
  const { data: tasks, error } = await loadDemoTasks();

  if (error) {
    throw new Error(`Supabase task load failed: ${error.message}`);
  }

  let tasksUpdated = 0;

  for (const task of tasks ?? []) {
    if (!isObjectRecord(task)) {
      continue;
    }

    const id = getString(task.id);
    const status = getString(task.status);
    const priority = getString(task.priority);

    if (!id || status !== "Open" || priority !== "High") {
      continue;
    }

    const updates: DemoTaskUpdate = {
      status: "In progress",
    };
    const { data, error: updateError, previousData } = await updateDemoTask(
      id,
      updates,
    );

    if (updateError) {
      throw new Error(`Supabase task triage failed: ${updateError.message}`);
    }

    if (data) {
      const previousTask = normalizeTaskEventRecord(previousData);
      const updatedTask = normalizeTaskEventRecord(data, previousTask);

      await createTaskActivityEvent({
        action: "task_updated",
        task: updatedTask,
        details: buildUpdatedTaskEventDetails(
          updates,
          previousTask,
          updatedTask,
        ),
      });
      tasksUpdated += 1;
    }
  }

  return tasksUpdated;
}

export async function runAutomationEngine(): Promise<AutomationEngineRunResult> {
  const sourceRecords = await loadAllWorkflowRecords();
  const preparedRecords: unknown[] = [];
  let recordsAutoAnalyzed = 0;

  for (const record of sourceRecords) {
    const prepared = await prepareRecordForAutomation(record);

    preparedRecords.push(prepared.record);

    if (prepared.autoAnalyzed) {
      recordsAutoAnalyzed += 1;
    }
  }

  const taskRecords = preparedRecords
    .map(mapDemoRecordForTaskAutomation)
    .filter(isTaskRecord);
  const results: WorkflowAutomationResult[] = [];

  for (const record of taskRecords) {
    results.push(
      await runWorkflowAutomationForRecord(record, {
        automationMode: "automation_engine",
      }),
    );
  }

  const workflowSummary = summarizeWorkflowAutomationResults(results);
  const tasksUpdated = await triageTasks();
  const recordsUpdatedIds = new Set<string>();

  preparedRecords.forEach((record) => {
    const analysisRecord = mapDemoRecordForAnalysis(record);

    if (analysisRecord && hasSavedAnalysis(analysisRecord)) {
      const originalRecord = mapDemoRecordForAnalysis(
        sourceRecords.find(
          (sourceRecord) =>
            isObjectRecord(sourceRecord) && sourceRecord.id === analysisRecord.id,
        ),
      );

      if (originalRecord && !hasSavedAnalysis(originalRecord)) {
        recordsUpdatedIds.add(analysisRecord.id);
      }
    }
  });

  results.forEach((result) => {
    if (result.statusUpdated) {
      recordsUpdatedIds.add(result.recordId);
    }
  });

  const responseBody: AutomationEngineRunResult = {
    ok: true,
    runType: "automation_engine",
    recordsScanned: workflowSummary.recordsScanned,
    recordsAutoAnalyzed,
    recordsUpdated: recordsUpdatedIds.size,
    tasksCreated: workflowSummary.tasksCreated,
    tasksUpdated,
    duplicatesSkipped: workflowSummary.duplicatesSkipped,
    results,
  };

  await createAutomationActivityEvent({
    action: "automation_engine_run",
    title: "Automation engine run",
    details: responseBody,
  });

  return responseBody;
}
