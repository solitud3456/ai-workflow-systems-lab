import { isObjectRecord, loadDemoRecords } from "@/lib/demoRecordsApi";
import {
  createDemoTasks,
  loadDemoTasksForRecord,
  type DemoTaskInsert,
} from "@/lib/demoTasksApi";
import {
  buildTaskEventDetails,
  createAutomationActivityEvent,
  createTaskActivityEvent,
} from "@/lib/taskActivity";

const approvedTaskDemoTypes = [
  "lead_follow_up",
  "recruitment_assistant",
  "document_intake",
] as const;

export type TaskSkipReason =
  | "no_analysis"
  | "no_action_fields"
  | "duplicates_skipped";

export type DemoRecordForTaskAutomation = {
  id: string;
  demo_type: string;
  title: string;
  raw_input: unknown;
  analysis: unknown;
  analysis_approved: boolean;
};

export type TaskAutomationResult = {
  recordId: string;
  demoType: string;
  recordTitle: string;
  tasksCreated: number;
  tasks: unknown[];
  reason: TaskSkipReason | null;
  duplicatesSkipped: number;
  candidateTasks: number;
};

export type ApprovedTaskGenerationSummary = {
  processedRecords: number;
  tasksCreated: number;
  skippedNoAnalysis: number;
  skippedNoActionFields: number;
  duplicatesSkipped: number;
  results: TaskAutomationResult[];
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

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRecordTitle(record: Record<string, unknown>) {
  return typeof record.title === "string" && record.title.trim()
    ? record.title.trim()
    : "Untitled record";
}

export function mapDemoRecordForTaskAutomation(
  record: unknown,
): DemoRecordForTaskAutomation | null {
  if (
    !isObjectRecord(record) ||
    typeof record.id !== "string" ||
    typeof record.demo_type !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    demo_type: record.demo_type,
    title: getRecordTitle(record),
    raw_input: record.raw_input ?? null,
    analysis: record.analysis ?? null,
    analysis_approved:
      typeof record.analysis_approved === "boolean"
        ? record.analysis_approved
        : false,
  };
}

function isTaskRecord(
  record: DemoRecordForTaskAutomation | null,
): record is DemoRecordForTaskAutomation {
  return Boolean(record);
}

function buildTask(
  record: DemoRecordForTaskAutomation,
  title: string,
  options: {
    priority?: string;
    notes?: string | null;
  } = {},
): DemoTaskInsert {
  return {
    demo_record_id: record.id,
    demo_type: record.demo_type,
    title,
    status: "Open",
    priority: options.priority ?? "Normal",
    source_record_title: record.title,
    notes: options.notes ?? null,
    due_date: null,
  };
}

function buildLeadTasks(
  record: DemoRecordForTaskAutomation,
  analysis: Record<string, unknown>,
) {
  const nextAction = getString(analysis.nextAction);

  if (!nextAction) {
    return [];
  }

  const notes = [
    getString(analysis.suggestedReply),
    getString(analysis.riskNote),
  ]
    .filter((item): item is string => Boolean(item))
    .join("\n\n");
  const urgency = getString(analysis.urgency)?.toLowerCase();

  return [
    buildTask(record, nextAction, {
      priority: urgency === "high" ? "High" : "Normal",
      notes: notes || null,
    }),
  ];
}

function buildRecruitmentTasks(
  record: DemoRecordForTaskAutomation,
  analysis: Record<string, unknown>,
) {
  const nextAction = getString(analysis.nextAction);

  if (!nextAction) {
    return [];
  }

  const questions = getStringArray(analysis.suggestedInterviewQuestions);
  const notes = questions.length
    ? `Suggested interview questions:\n${questions
        .map((question) => `- ${question}`)
        .join("\n")}`
    : null;

  return [
    buildTask(record, nextAction, {
      notes,
    }),
  ];
}

function buildDocumentTasks(
  record: DemoRecordForTaskAutomation,
  analysis: Record<string, unknown>,
) {
  const actionItems = getStringArray(analysis.actionItems);
  const fallbackAction = getString(analysis.nextAction);
  const taskTitles = actionItems.length
    ? actionItems
    : fallbackAction
      ? [fallbackAction]
      : [];
  const missingInfo = getStringArray(analysis.missingInformation);
  const notes = missingInfo.length
    ? `Missing information:\n${missingInfo.map((item) => `- ${item}`).join("\n")}`
    : null;

  return taskTitles.map((title) =>
    buildTask(record, title, {
      notes,
    }),
  );
}

function getTaskCandidates(record: DemoRecordForTaskAutomation) {
  const analysis = parseMaybeJson(record.analysis);

  if (!isObjectRecord(analysis)) {
    return {
      reason: "no_analysis" as const,
      tasks: [],
    };
  }

  if (record.demo_type === "lead_follow_up") {
    return {
      reason: null,
      tasks: buildLeadTasks(record, analysis),
    };
  }

  if (record.demo_type === "recruitment_assistant") {
    return {
      reason: null,
      tasks: buildRecruitmentTasks(record, analysis),
    };
  }

  if (record.demo_type === "document_intake") {
    return {
      reason: null,
      tasks: buildDocumentTasks(record, analysis),
    };
  }

  return {
    reason: "no_action_fields" as const,
    tasks: [],
  };
}

function dedupeTasks(
  candidateTasks: DemoTaskInsert[],
  existingTasks: unknown[],
) {
  const existingTitles = new Set(
    existingTasks
      .filter(isObjectRecord)
      .map((task) => getString(task.title)?.toLowerCase())
      .filter((title): title is string => Boolean(title)),
  );

  return candidateTasks.filter(
    (task) => !existingTitles.has(task.title.toLowerCase()),
  );
}

function buildResult(
  record: DemoRecordForTaskAutomation,
  result: Omit<
    TaskAutomationResult,
    "recordId" | "demoType" | "recordTitle"
  >,
): TaskAutomationResult {
  return {
    recordId: record.id,
    demoType: record.demo_type,
    recordTitle: record.title,
    ...result,
  };
}

export async function createTasksForDemoRecord(
  record: DemoRecordForTaskAutomation,
  options: {
    automationMode?: string;
  } = {},
): Promise<TaskAutomationResult> {
  const candidateResult = getTaskCandidates(record);
  const candidateTasks = candidateResult.tasks;

  if (candidateTasks.length === 0) {
    return buildResult(record, {
      tasksCreated: 0,
      tasks: [],
      reason: candidateResult.reason ?? "no_action_fields",
      duplicatesSkipped: 0,
      candidateTasks: 0,
    });
  }

  const { data: existingTasks, error: existingError } =
    await loadDemoTasksForRecord(record.id);

  if (existingError) {
    throw new Error(
      `Supabase task duplicate check failed: ${existingError.message}`,
    );
  }

  const tasksToCreate = dedupeTasks(candidateTasks, existingTasks ?? []);
  const duplicatesSkipped = candidateTasks.length - tasksToCreate.length;

  if (tasksToCreate.length === 0) {
    return buildResult(record, {
      tasksCreated: 0,
      tasks: [],
      reason: "duplicates_skipped",
      duplicatesSkipped,
      candidateTasks: candidateTasks.length,
    });
  }

  const { data: tasks, error: createError } =
    await createDemoTasks(tasksToCreate);

  if (createError) {
    throw new Error(`Supabase task create failed: ${createError.message}`);
  }

  await Promise.all(
    (tasks ?? []).map((task) =>
      createTaskActivityEvent({
        action: "task_created",
        task,
        details: buildTaskEventDetails(task, {
          source: "automation",
          automation_mode: options.automationMode ?? "single_record",
          source_demo_record_id: record.id,
          source_record_title: record.title,
        }),
      }),
    ),
  );

  return buildResult(record, {
    tasksCreated: tasks?.length ?? 0,
    tasks: tasks ?? [],
    reason: null,
    duplicatesSkipped,
    candidateTasks: candidateTasks.length,
  });
}

function summarizeApprovedResults(
  processedRecords: number,
  results: TaskAutomationResult[],
): ApprovedTaskGenerationSummary {
  return {
    processedRecords,
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
    results,
  };
}

function getCreatedRecordSummaries(results: TaskAutomationResult[]) {
  return results
    .filter((result) => result.tasksCreated > 0)
    .map((result) => ({
      demo_record_id: result.recordId,
      demo_type: result.demoType,
      title: result.recordTitle,
      tasksCreated: result.tasksCreated,
    }));
}

export function buildApprovedTaskGenerationEventDetails(
  summary: ApprovedTaskGenerationSummary,
) {
  return {
    processedRecords: summary.processedRecords,
    tasksCreated: summary.tasksCreated,
    skippedNoAnalysis: summary.skippedNoAnalysis,
    skippedNoActionFields: summary.skippedNoActionFields,
    duplicatesSkipped: summary.duplicatesSkipped,
    createdRecords: getCreatedRecordSummaries(summary.results),
  };
}

export async function createTasksForApprovedDemoRecords({
  automationMode = "approved_records",
  logActivity = false,
  activityAction = "bulk_tasks_generated",
  activityTitle = "Generated tasks for approved records",
  logWhenNoTasks = false,
  activityRunType,
  includeResultsInActivity = false,
}: {
  automationMode?: string;
  logActivity?: boolean;
  activityAction?: "bulk_tasks_generated" | "automation_run";
  activityTitle?: string;
  logWhenNoTasks?: boolean;
  activityRunType?: string;
  includeResultsInActivity?: boolean;
} = {}): Promise<ApprovedTaskGenerationSummary> {
  const recordsByDemoType = await Promise.all(
    approvedTaskDemoTypes.map(async (demoType) => {
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
        automationMode,
      }),
    );
  }

  const summary = summarizeApprovedResults(approvedRecords.length, results);

  if (logActivity && (logWhenNoTasks || summary.tasksCreated > 0)) {
    const details = {
      ...buildApprovedTaskGenerationEventDetails(summary),
      ...(activityRunType ? { runType: activityRunType } : {}),
      ...(includeResultsInActivity ? { results: summary.results } : {}),
    };

    await createAutomationActivityEvent({
      action: activityAction,
      title: activityTitle,
      details,
    });
  }

  return summary;
}
