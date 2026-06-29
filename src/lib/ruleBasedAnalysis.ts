import { isObjectRecord } from "@/lib/demoRecordsApi";
import { workflowAutomationDemoTypes } from "@/lib/workflowAutomation";

export type DemoRecordForAnalysis = {
  id: string;
  demo_type: string;
  title: string;
  status: string;
  source: string | null;
  raw_input: unknown;
  internal_notes: string | null;
  analysis: unknown;
  analysis_approved: boolean;
};

export type RuleBasedAnalysisResult = {
  analysis: Record<string, unknown>;
  analysisApproved: boolean;
};

const actionWords = [
  "please",
  "need to",
  "update",
  "confirm",
  "send",
  "review",
  "assign",
  "action",
  "follow up",
  "prepare",
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
  return typeof value === "string" ? value.trim() : "";
}

function getRecordTitle(record: Record<string, unknown>) {
  return getString(record.title) || "Untitled record";
}

function lower(value: string) {
  return value.toLowerCase();
}

function hasAny(text: string, words: readonly string[]) {
  const normalized = lower(text);
  return words.some((word) => normalized.includes(word));
}

function getField(rawInput: Record<string, unknown>, fields: string[]) {
  for (const field of fields) {
    const value = getString(rawInput[field]);

    if (value) {
      return value;
    }
  }

  return "";
}

function joinText(parts: string[]) {
  return parts.filter(Boolean).join(" ").trim();
}

function clip(text: string, fallback: string, maxLength = 180) {
  const trimmed = text.replace(/\s+/g, " ").trim();

  if (!trimmed) {
    return fallback;
  }

  return trimmed.length > maxLength
    ? `${trimmed.slice(0, maxLength - 3).trim()}...`
    : trimmed;
}

function splitText(text: string) {
  return text
    .split(/\n|\.|\?|!|;/)
    .map((item) => item.trim())
    .filter((item) => item.length > 6);
}

function extractActionItems(text: string, fallback: string) {
  const items = splitText(text)
    .filter((item) => hasAny(item, actionWords))
    .slice(0, 5);

  return items.length ? items : [fallback];
}

function getStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => getString(item))
    .filter((item) => item.length > 0);
}

function missingIfAbsent(
  text: string,
  checks: Array<{ label: string; words: readonly string[] }>,
) {
  return checks
    .filter((check) => !hasAny(text, check.words))
    .map((check) => check.label);
}

function isBeforeToday(dateValue: string) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(`${dateValue}T00:00:00`);
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  return !Number.isNaN(date.getTime()) && date < todayStart;
}

function hasActionSignal(analysis: Record<string, unknown>) {
  return Boolean(
    getString(analysis.nextAction) ||
      getString(analysis.suggestedReply) ||
      getString(analysis.suggestedReminder) ||
      getStringArray(analysis.actionItems).length ||
      getStringArray(analysis.internalChecklist).length,
  );
}

function normalizeIssueType(value: string, text: string) {
  const normalized = lower(value || text);

  if (hasAny(normalized, ["bill", "charge", "invoice", "payment", "refund"])) {
    return "billing";
  }

  if (hasAny(normalized, ["technical", "bug", "error", "not working"])) {
    return "technical";
  }

  if (hasAny(normalized, ["account", "login", "locked", "password"])) {
    return "account";
  }

  if (hasAny(normalized, ["complaint", "angry", "unacceptable"])) {
    return "complaint";
  }

  return "other";
}

function analyzeLead(record: DemoRecordForAnalysis, rawInput: Record<string, unknown>) {
  const message = joinText([
    getField(rawInput, ["message", "customerMessage", "rawInput"]),
    getField(rawInput, ["notes", "internalNotes"]),
  ]);
  const name = getField(rawInput, ["name", "customerName"]) || record.title;
  const urgency = hasAny(message, [
    "urgent",
    "asap",
    "today",
    "immediately",
    "angry",
    "complaint",
    "refund",
    "deadline",
  ])
    ? "high"
    : hasAny(message, ["price", "availability", "booking", "schedule"])
      ? "medium"
      : "low";
  const customerIntent =
    urgency === "high"
      ? "The customer needs a quick human response because the inquiry contains urgency or risk language."
      : hasAny(message, ["price", "availability", "booking", "schedule"])
        ? "The customer is evaluating price, availability, booking, or schedule details."
        : "The customer needs a practical follow-up before intent can be confirmed.";
  const nextAction =
    urgency === "high"
      ? "Review the inquiry and respond with a clear next step today."
      : "Ask for the missing details needed to continue the follow-up.";

  return {
    summary: `${name} sent a customer inquiry that needs follow-up. ${clip(
      message,
      "The message has limited detail.",
      120,
    )}`,
    urgency,
    customerIntent,
    suggestedReply:
      "Hi, thanks for reaching out. I reviewed your message and can help with the next step. Could you confirm the key details so I can respond with the right information?",
    nextAction,
    riskNote:
      urgency === "high"
        ? "The message includes urgency or risk signals, so a human should review it before replying."
        : "The inquiry may still be missing service, schedule, budget, or contact details.",
  };
}

function analyzeRecruitment(
  record: DemoRecordForAnalysis,
  rawInput: Record<string, unknown>,
) {
  const text = joinText([
    getField(rawInput, ["applicationText", "notes"]),
    getField(rawInput, ["recruiterNotes", "internalNotes"]),
  ]);
  const role = getField(rawInput, ["role", "roleAppliedFor"]) || "the role";
  const fitScore = hasAny(text, [
    "years",
    "experience",
    "managed",
    "led",
    "certified",
    "senior",
  ])
    ? "high"
    : hasAny(text, [
        "skills",
        "customer service",
        "sales",
        "support",
        "communication",
        "project",
        "software",
      ])
      ? "medium"
      : "low";

  return {
    summary: `${record.title} applied for ${role}. ${clip(
      text,
      "The candidate notes are limited.",
      140,
    )}`,
    fitScore,
    strengths:
      fitScore === "high"
        ? "The notes include stronger experience signals such as leadership, certification, or years of experience."
        : fitScore === "medium"
          ? "The notes include some potentially relevant skills or communication experience."
          : "The notes do not show many clear fit signals yet.",
    concerns:
      "The record should be checked for missing skills, availability, compensation expectations, and role-specific evidence.",
    riskNote:
      "This rule-based screen is only a first pass and should not be treated as a hiring decision.",
    nextAction:
      fitScore === "low"
        ? "Ask for more role-specific information before moving forward."
        : "Schedule or prepare an initial screening conversation.",
    suggestedInterviewQuestions: [
      `What experience is most relevant to ${role}?`,
      "Can you describe a recent example of similar work?",
      "What is your availability and expected compensation range?",
    ],
  };
}

function analyzeDocument(
  record: DemoRecordForAnalysis,
  rawInput: Record<string, unknown>,
) {
  const content = joinText([
    getField(rawInput, ["content", "documentText", "text", "rawInput"]),
    getField(rawInput, ["internalNotes", "notes"]),
  ]);
  const documentType =
    getField(rawInput, ["type", "documentType"]) ||
    (hasAny(content, ["policy", "procedure"]) ? "Policy or procedure" : "General document");
  const missingInformation = missingIfAbsent(content, [
    { label: "Deadline or preferred timeline", words: ["deadline", "timeline", "due", "date"] },
    { label: "Approval contact", words: ["approval", "approver", "contact"] },
    { label: "Budget or cost details", words: ["budget", "cost", "price", "amount"] },
    { label: "Owner or responsible person", words: ["owner", "responsible", "assigned"] },
    { label: "Schedule or implementation timing", words: ["schedule", "when", "timeline"] },
  ]).slice(0, 5);
  const actionItems = extractActionItems(
    content,
    "Review the document and confirm the next practical step.",
  );

  return {
    summary: clip(
      content,
      `${record.title} needs review before follow-up action is taken.`,
    ),
    documentType,
    keyPoints: splitText(content).slice(0, 3),
    missingInformation,
    actionItems,
    nextAction: actionItems[0] ?? "Review the document and confirm the next step.",
    riskNote:
      "The document may be incomplete, so a human should verify key points and missing information.",
  };
}

function analyzeSupport(
  record: DemoRecordForAnalysis,
  rawInput: Record<string, unknown>,
) {
  const message = joinText([
    getField(rawInput, ["message", "ticketText", "rawInput"]),
    getField(rawInput, ["internalNotes", "notes"]),
  ]);
  const sentiment = hasAny(message, [
    "angry",
    "terrible",
    "unacceptable",
    "refund",
    "complaint",
  ])
    ? "angry"
    : hasAny(message, ["issue", "problem", "not working", "charged", "cannot"])
      ? "frustrated"
      : "neutral";
  const urgency = hasAny(message, [
    "urgent",
    "asap",
    "account locked",
    "payment",
    "refund",
    "security",
    "angry",
  ])
    ? "high"
    : "medium";
  const issueType = normalizeIssueType(getField(rawInput, ["issueType"]), message);
  const escalationNeeded =
    sentiment === "angry" ||
    hasAny(message, ["refund", "security", "payment", "account locked"]);

  return {
    summary: `${record.title} submitted a support issue. ${clip(
      message,
      "The support message has limited detail.",
      140,
    )}`,
    sentiment,
    urgency,
    issueType,
    riskNote:
      escalationNeeded
        ? "This ticket has escalation signals and should be reviewed before replying."
        : "The issue should be verified against account or support history before replying.",
    nextAction:
      escalationNeeded
        ? "Escalate or review the ticket details before sending a customer reply."
        : "Review the ticket details and respond with the next support step.",
    suggestedReply:
      "Thanks for flagging this. I will review the details and follow up with the next step shortly.",
    escalationNeeded,
  };
}

function analyzeInvoice(
  record: DemoRecordForAnalysis,
  rawInput: Record<string, unknown>,
) {
  const message = joinText([
    getField(rawInput, ["message", "rawInput"]),
    getField(rawInput, ["internalNotes", "notes"]),
  ]);
  const dueDate = getField(rawInput, ["dueDate"]);
  const paymentStatus = getField(rawInput, ["paymentStatus", "status"]);
  const amount = getField(rawInput, ["amount"]);
  const isOverdue =
    isBeforeToday(dueDate) || hasAny(paymentStatus, ["overdue", "unpaid"]);
  const paymentRisk = isOverdue
    ? "high"
    : hasAny(message, ["dispute", "delay", "cannot pay", "issue"])
      ? "medium"
      : "low";
  const urgency = paymentRisk === "high" ? "high" : "medium";
  const missingInformation = missingIfAbsent(
    `${message} ${amount} ${dueDate} ${paymentStatus}`,
    [
      { label: "Invoice amount", words: ["amount", "$", "usd"] },
      { label: "Due date", words: ["due", "date"] },
      { label: "Payment method or payment link", words: ["payment method", "payment link", "bank", "card"] },
    ],
  );
  const nextAction = isOverdue
    ? "Send a clear overdue payment follow-up and confirm any payment blockers."
    : "Send a polite payment reminder with invoice details and due date.";

  return {
    summary: `${record.title} has an invoice follow-up record. ${clip(
      message,
      "The invoice context has limited detail.",
      140,
    )}`,
    paymentRisk,
    urgency,
    missingInformation,
    nextAction,
    suggestedReminder:
      "Hi, I am following up on the invoice. Could you confirm the payment timeline or let me know if anything is blocking payment?",
    escalationNeeded: paymentRisk === "high",
  };
}

function analyzeMeeting(
  record: DemoRecordForAnalysis,
  rawInput: Record<string, unknown>,
) {
  const notes = joinText([
    getField(rawInput, ["notes", "meetingNotes", "rawInput"]),
    getField(rawInput, ["internalNotes"]),
  ]);
  const actionItems = extractActionItems(
    notes,
    "Confirm meeting follow-up items and assign owners.",
  ).map((task) => ({
    task,
    owner: "",
    deadline: "",
  }));
  const decisions = splitText(notes)
    .filter((item) => hasAny(item, ["decided", "agreed", "decision", "approved"]))
    .slice(0, 3);
  const missingInformation = missingIfAbsent(notes, [
    { label: "Named owner for each action item", words: ["owner", "assigned", "responsible"] },
    { label: "Deadline for each action item", words: ["deadline", "due", "by "] },
  ]);

  return {
    summary: `${record.title} contains meeting notes with follow-up work. ${clip(
      notes,
      "The notes have limited detail.",
      140,
    )}`,
    decisions,
    actionItems,
    missingInformation,
    nextAction: "Confirm owners and deadlines, then create follow-up tasks.",
    riskNote:
      "Owners, decisions, or dates may be incomplete and should be confirmed by a human.",
  };
}

function analyzeItRequest(
  record: DemoRecordForAnalysis,
  rawInput: Record<string, unknown>,
) {
  const requestText = joinText([
    getField(rawInput, ["requestText", "message", "rawInput"]),
    getField(rawInput, ["internalNotes", "notes"]),
  ]);
  const requestType = lower(getField(rawInput, ["requestType"]) || "other");
  const priority = lower(getField(rawInput, ["priority"]));
  const approvalNeeded =
    hasAny(requestType, ["account access", "security", "hardware"]) ||
    hasAny(requestText, ["admin access", "approval", "permission"]);
  const securityRisk = hasAny(requestText, [
    "password",
    "admin",
    "production",
    "payment",
    "customer data",
  ])
    ? "high"
    : hasAny(requestText, ["access", "security", "permission"])
      ? "medium"
      : "low";
  const urgency =
    priority === "high" || hasAny(requestText, ["urgent", "asap", "today"])
      ? "high"
      : "medium";
  const missingInformation = missingIfAbsent(requestText, [
    { label: "Approver or manager approval", words: ["approval", "approver", "manager"] },
    { label: "Exact access level or system name", words: ["access", "system", "permission"] },
    { label: "Needed-by date", words: ["needed", "date", "deadline"] },
  ]);
  const internalChecklist = [
    ...(approvalNeeded ? ["Confirm approval before fulfillment"] : []),
    "Verify request details and affected system",
    "Document the completed IT action",
  ];

  return {
    summary: `${record.title} submitted an IT request. ${clip(
      requestText,
      "The request has limited detail.",
      140,
    )}`,
    requestType,
    urgency,
    securityRisk,
    approvalNeeded,
    missingInformation,
    nextAction: approvalNeeded
      ? "Confirm approval and required access level before fulfillment."
      : "Review the request details and begin the next IT support step.",
    internalChecklist,
  };
}

function analyzeVendor(
  record: DemoRecordForAnalysis,
  rawInput: Record<string, unknown>,
) {
  const message = joinText([
    getField(rawInput, ["message", "rawInput"]),
    getField(rawInput, ["internalNotes", "notes"]),
  ]);
  const requestType = lower(getField(rawInput, ["requestType"]) || "other");
  const quotedAmount = getField(rawInput, ["quotedAmount"]);
  const deliveryDate = getField(rawInput, ["deliveryDate"]);
  const priceOrTermsMentioned =
    Boolean(quotedAmount) || hasAny(message, ["price", "quote", "terms", "cost"]);
  const missingInformation = [
    ...(!priceOrTermsMentioned ? ["Price or contract terms"] : []),
    ...(!deliveryDate && !hasAny(message, ["delivery", "date", "timeline"])
      ? ["Delivery date or timeline"]
      : []),
    ...(!hasAny(message, ["payment terms", "terms", "contract"])
      ? ["Payment or contract terms"]
      : []),
  ];
  const decisionNeeded =
    hasAny(requestType, ["quote", "contract"]) ||
    hasAny(message, ["quote", "contract", "price", "approval"]);
  const riskLevel =
    hasAny(message, ["urgent", "issue", "penalty", "contract"]) ||
    missingInformation.length > 1
      ? "high"
      : decisionNeeded
        ? "medium"
        : "low";

  return {
    summary: `${record.title} has a vendor request. ${clip(
      message,
      "The vendor message has limited detail.",
      140,
    )}`,
    requestType,
    riskLevel,
    missingInformation,
    priceOrTermsMentioned,
    nextAction:
      missingInformation.length > 0
        ? "Ask the vendor to confirm missing information before internal review."
        : "Review the vendor request and decide the next procurement step.",
    suggestedReply:
      "Thanks for the update. Could you confirm the remaining details so we can review this internally?",
    decisionNeeded,
  };
}

export function mapDemoRecordForAnalysis(
  record: unknown,
): DemoRecordForAnalysis | null {
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
    status: getString(record.status) || "New",
    source: getString(record.source) || null,
    raw_input: record.raw_input ?? null,
    internal_notes: getString(record.internal_notes) || null,
    analysis: record.analysis ?? null,
    analysis_approved: record.analysis_approved === true,
  };
}

export function hasSavedAnalysis(record: DemoRecordForAnalysis) {
  const analysis = parseMaybeJson(record.analysis);

  return isObjectRecord(analysis) && Object.keys(analysis).length > 0;
}

export function isSupportedAnalysisDemoType(demoType: string) {
  return workflowAutomationDemoTypes.includes(
    demoType as (typeof workflowAutomationDemoTypes)[number],
  );
}

export function generateRuleBasedAnalysis(
  record: DemoRecordForAnalysis,
): RuleBasedAnalysisResult {
  const parsedRawInput = parseMaybeJson(record.raw_input);
  const rawInput = isObjectRecord(parsedRawInput) ? parsedRawInput : {};
  let analysis: Record<string, unknown>;

  if (record.demo_type === "lead_follow_up") {
    analysis = analyzeLead(record, rawInput);
  } else if (record.demo_type === "recruitment_assistant") {
    analysis = analyzeRecruitment(record, rawInput);
  } else if (record.demo_type === "document_intake") {
    analysis = analyzeDocument(record, rawInput);
  } else if (record.demo_type === "support_ticket") {
    analysis = analyzeSupport(record, rawInput);
  } else if (record.demo_type === "invoice_follow_up") {
    analysis = analyzeInvoice(record, rawInput);
  } else if (record.demo_type === "meeting_actions") {
    analysis = analyzeMeeting(record, rawInput);
  } else if (record.demo_type === "it_request") {
    analysis = analyzeItRequest(record, rawInput);
  } else if (record.demo_type === "vendor_request") {
    analysis = analyzeVendor(record, rawInput);
  } else {
    analysis = {
      summary: `${record.title} needs human review.`,
      nextAction: "Review this workflow record and decide the next step.",
      riskNote: "This workflow type is not supported by the rule engine yet.",
    };
  }

  return {
    analysis,
    analysisApproved: hasActionSignal(analysis),
  };
}
