export const WORKFLOW_STATUS_PRESETS = [
  "New",
  "Needs review",
  "Due soon",
  "Overdue",
  "Approved",
  "Actions created",
  "Needs approval",
  "In progress",
  "Blocked",
  "Follow-up",
  "Escalated",
  "Resolved",
  "Waiting info",
  "Under review",
  "Paid",
  "Done",
  "Rejected",
  "Closed",
] as const;

export const UNSPECIFIED_WORKFLOW_STATUS = "Unspecified";

const presetStatusSet = new Set<string>(WORKFLOW_STATUS_PRESETS);

export function getWorkflowStatusOptions(statuses: Iterable<string>) {
  const customStatuses = Array.from(
    new Set(
      Array.from(statuses)
        .map((status) => status.trim())
        .filter((status) => status && !presetStatusSet.has(status)),
    ),
  ).sort((first, second) => first.localeCompare(second));

  return [...WORKFLOW_STATUS_PRESETS, ...customStatuses];
}

export function getWorkflowStatusColumns(
  statuses: Iterable<string>,
  includeUnspecified: boolean,
) {
  const columns = getWorkflowStatusOptions(statuses);

  if (includeUnspecified && !columns.includes(UNSPECIFIED_WORKFLOW_STATUS)) {
    return [...columns, UNSPECIFIED_WORKFLOW_STATUS];
  }

  return columns;
}
