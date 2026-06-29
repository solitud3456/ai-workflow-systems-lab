import { isObjectRecord, updateDemoRecord } from "@/lib/demoRecordsApi";
import {
  createTasksForDemoRecord,
  type DemoRecordForTaskAutomation,
  type TaskAutomationResult,
} from "@/lib/taskAutomation";

export type WorkflowAutomationResult = {
  recordId: string;
  demoType: string;
  title: string;
  statusBefore: string;
  statusAfter: string;
  statusUpdated: boolean;
  taskResult: TaskAutomationResult;
};

export const workflowAutomationDemoTypes = [
  "lead_follow_up",
  "recruitment_assistant",
  "document_intake",
  "support_ticket",
  "invoice_follow_up",
  "meeting_actions",
  "it_request",
  "vendor_request",
] as const;

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

export function getWorkflowAutomationTriageStatus(
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

  if (record.demo_type === "support_ticket") {
    const urgency = getString(analysis.urgency)?.toLowerCase();
    const nextAction = getString(analysis.nextAction);

    if (analysis.escalationNeeded === true) {
      return "Escalated";
    }

    if (urgency === "high") {
      return "Follow-up";
    }

    if (nextAction && currentStatus === "New") {
      return "Needs review";
    }
  }

  if (record.demo_type === "invoice_follow_up") {
    const urgency = getString(analysis.urgency)?.toLowerCase();
    const paymentRisk = getString(analysis.paymentRisk)?.toLowerCase();

    if (currentStatus === "Paid" || currentStatus === "Closed") {
      return null;
    }

    if (
      paymentRisk === "high" ||
      urgency === "high" ||
      analysis.escalationNeeded === true
    ) {
      return "Follow-up";
    }
  }

  if (record.demo_type === "meeting_actions") {
    if (Array.isArray(analysis.actionItems) && analysis.actionItems.length > 0) {
      return "Actions created";
    }

    if (hasStringItems(analysis.missingInformation) && currentStatus === "New") {
      return "Needs review";
    }
  }

  if (record.demo_type === "it_request") {
    const securityRisk = getString(analysis.securityRisk)?.toLowerCase();
    const nextAction = getString(analysis.nextAction);

    if (analysis.approvalNeeded === true) {
      return "Needs approval";
    }

    if (securityRisk === "high") {
      return "In progress";
    }

    if (nextAction && currentStatus === "New") {
      return "In progress";
    }
  }

  if (record.demo_type === "vendor_request") {
    const riskLevel = getString(analysis.riskLevel)?.toLowerCase();

    if (hasStringItems(analysis.missingInformation)) {
      return "Waiting info";
    }

    if (analysis.decisionNeeded === true) {
      return "Under review";
    }

    if (riskLevel === "high" && currentStatus === "New") {
      return "Under review";
    }
  }

  return null;
}

export async function runWorkflowAutomationForRecord(
  record: DemoRecordForTaskAutomation,
  options: {
    automationMode?: string;
  } = {},
): Promise<WorkflowAutomationResult> {
  const statusBefore = record.status;
  const nextStatus = getWorkflowAutomationTriageStatus(record, statusBefore);
  let statusAfter = statusBefore;
  let statusUpdated = false;

  if (nextStatus && nextStatus !== statusBefore) {
    const { data, error } = await updateDemoRecord(record.demo_type, record.id, {
      status: nextStatus,
    });

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

  const taskResult = await createTasksForDemoRecord(
    {
      ...record,
      status: statusAfter,
    },
    {
      automationMode: options.automationMode ?? "workflow_automation",
    },
  );

  return {
    recordId: record.id,
    demoType: record.demo_type,
    title: record.title,
    statusBefore,
    statusAfter,
    statusUpdated,
    taskResult,
  };
}

export function summarizeWorkflowAutomationResults(
  results: WorkflowAutomationResult[],
) {
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
