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
  createDemoTasks,
  loadDemoTasksForRecord,
  type DemoTaskInsert,
} from "@/lib/demoTasksApi";

type AutomationRequest = {
  recordId: string;
  demoType: string;
};

type DemoRecordForTasks = {
  id: string;
  demo_type: string;
  title: string;
  raw_input: unknown;
  analysis: unknown;
};

type TaskSkipReason =
  | "no_analysis"
  | "no_action_fields"
  | "duplicates_skipped";

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

function getRecordTitle(record: unknown) {
  return isObjectRecord(record) && typeof record.title === "string"
    ? record.title
    : "Untitled record";
}

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

function buildTask(
  record: DemoRecordForTasks,
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
  record: DemoRecordForTasks,
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
  record: DemoRecordForTasks,
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
  record: DemoRecordForTasks,
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

function getTaskCandidates(record: DemoRecordForTasks) {
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

function taskResponse({
  tasksCreated,
  tasks,
  reason,
  duplicatesSkipped,
  candidateTasks,
}: {
  tasksCreated: number;
  tasks: unknown[];
  reason: TaskSkipReason | null;
  duplicatesSkipped: number;
  candidateTasks: number;
}) {
  return Response.json({
    ok: true,
    tasksCreated,
    tasks,
    reason,
    duplicatesSkipped,
    candidateTasks,
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

    const taskRecord: DemoRecordForTasks = {
      id: record.id,
      demo_type: record.demo_type,
      title: getRecordTitle(record),
      raw_input: record.raw_input ?? null,
      analysis: record.analysis ?? null,
    };
    const candidateResult = getTaskCandidates(taskRecord);
    const candidateTasks = candidateResult.tasks;

    if (candidateTasks.length === 0) {
      return taskResponse({
        tasksCreated: 0,
        tasks: [],
        reason: candidateResult.reason ?? "no_action_fields",
        duplicatesSkipped: 0,
        candidateTasks: 0,
      });
    }

    const { data: existingTasks, error: existingError } =
      await loadDemoTasksForRecord(taskRecord.id);

    if (existingError) {
      return jsonError(
        `Supabase task duplicate check failed: ${existingError.message}`,
        500,
      );
    }

    const tasksToCreate = dedupeTasks(candidateTasks, existingTasks ?? []);
    const duplicatesSkipped = candidateTasks.length - tasksToCreate.length;

    if (tasksToCreate.length === 0) {
      return taskResponse({
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
      return jsonError(`Supabase task create failed: ${createError.message}`, 500);
    }

    return taskResponse({
      tasksCreated: tasks?.length ?? 0,
      tasks: tasks ?? [],
      reason: null,
      duplicatesSkipped,
      candidateTasks: candidateTasks.length,
    });
  } catch (error) {
    return jsonError(getErrorMessage(error), getConfigErrorStatus(error));
  }
}
