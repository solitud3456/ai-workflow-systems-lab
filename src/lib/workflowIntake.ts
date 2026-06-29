import {
  createDemoRecordEvent,
  insertDemoRecord,
  isObjectRecord,
  jsonError,
  type DemoRecordInsert,
} from "@/lib/demoRecordsApi";
import { mapDemoRecordForTaskAutomation } from "@/lib/taskAutomation";
import {
  runWorkflowAutomationForRecord,
  workflowAutomationDemoTypes,
} from "@/lib/workflowAutomation";

export type WorkflowIntakeAutomationSummary = {
  ran: boolean;
  tasksCreated: number;
  statusUpdated: boolean;
};

type WorkflowIntakePayload = {
  demoType: (typeof workflowAutomationDemoTypes)[number];
  title: string;
  status: string;
  source: string | null;
  rawInput: unknown;
  internalNotes: string | null;
  analysis: unknown;
  analysisApproved: boolean;
  runAutomation: boolean;
};

function getOptionalString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function getRequiredTitle(value: unknown): string | Response {
  if (typeof value !== "string" || value.trim().length < 3) {
    return jsonError("title must be at least 3 characters.", 400);
  }

  return value.trim();
}

function isWorkflowDemoType(
  value: unknown,
): value is (typeof workflowAutomationDemoTypes)[number] {
  return (
    typeof value === "string" &&
    workflowAutomationDemoTypes.includes(
      value as (typeof workflowAutomationDemoTypes)[number],
    )
  );
}

export function mapWorkflowIntakeBody(
  body: unknown,
): WorkflowIntakePayload | Response {
  if (!isObjectRecord(body)) {
    return jsonError("Request body must be a JSON object.", 400);
  }

  if (!isWorkflowDemoType(body.demoType)) {
    return jsonError("demoType is not supported.", 400);
  }

  const title = getRequiredTitle(body.title);

  if (title instanceof Response) {
    return title;
  }

  if ("status" in body && typeof body.status !== "string") {
    return jsonError("status must be a string.", 400);
  }

  if ("source" in body && typeof body.source !== "string" && body.source !== null) {
    return jsonError("source must be a string or null.", 400);
  }

  if (
    "internalNotes" in body &&
    typeof body.internalNotes !== "string" &&
    body.internalNotes !== null
  ) {
    return jsonError("internalNotes must be a string or null.", 400);
  }

  if (
    "analysisApproved" in body &&
    typeof body.analysisApproved !== "boolean"
  ) {
    return jsonError("analysisApproved must be a boolean.", 400);
  }

  if ("runAutomation" in body && typeof body.runAutomation !== "boolean") {
    return jsonError("runAutomation must be a boolean.", 400);
  }

  return {
    demoType: body.demoType,
    title,
    status:
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : "New",
    source: getOptionalString(body.source),
    rawInput: body.rawInput ?? {},
    internalNotes: getOptionalString(body.internalNotes),
    analysis: body.analysis ?? null,
    analysisApproved:
      typeof body.analysisApproved === "boolean"
        ? body.analysisApproved
        : false,
    runAutomation:
      typeof body.runAutomation === "boolean" ? body.runAutomation : false,
  };
}

export async function createWorkflowIntakeRecord(
  payload: WorkflowIntakePayload,
) {
  const recordToInsert: DemoRecordInsert = {
    demo_type: payload.demoType,
    title: payload.title,
    status: payload.status,
    source: payload.source,
    raw_input: JSON.stringify(payload.rawInput ?? {}),
    internal_notes: payload.internalNotes,
    analysis: payload.analysis,
    analysis_approved: payload.analysisApproved,
  };
  const { data: insertedRecord, error } = await insertDemoRecord(recordToInsert);

  if (error) {
    throw new Error(`Supabase workflow intake failed: ${error.message}`);
  }

  if (!insertedRecord) {
    throw new Error("Supabase workflow intake did not return a record.");
  }

  await createDemoRecordEvent({
    demo_record_id: insertedRecord.id,
    demo_type: payload.demoType,
    action: "workflow_intake_created",
    title: insertedRecord.title,
    details: {
      demoType: payload.demoType,
      source: payload.source,
      runAutomation: payload.runAutomation,
    },
  });

  let record = insertedRecord;
  const automation: WorkflowIntakeAutomationSummary = {
    ran: payload.runAutomation,
    tasksCreated: 0,
    statusUpdated: false,
  };

  if (payload.runAutomation) {
    const taskRecord = mapDemoRecordForTaskAutomation(insertedRecord);

    if (taskRecord) {
      const automationResult = await runWorkflowAutomationForRecord(taskRecord, {
        automationMode: "workflow_intake",
      });

      automation.tasksCreated = automationResult.taskResult.tasksCreated;
      automation.statusUpdated = automationResult.statusUpdated;

      if (automationResult.statusUpdated) {
        record = {
          ...insertedRecord,
          status: automationResult.statusAfter,
        };
      }
    }
  }

  return {
    ok: true,
    record,
    automation,
  };
}
